import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { GuestProfile } from "@/server/models/GuestProfile";
import { User } from "@/server/models/User";
import {
  createRazorpayOrder,
  getRazorpayKeyIdPublic,
  isRazorpayConfigured
} from "@/server/payments/razorpay";
import { finalizeBookingAfterPayment } from "./bookingPaymentSideEffects";

export async function createBooking(input: {
  guestUserId: string;
  eventSlotId: string;
  seats: number;
  guestName: string;
  guestMobile: string;
  guestAge: number;
  guestGender: string;
  additionalGuests?: Array<{
    name: string;
    mobile: string;
    age: number;
    gender: string;
  }>;
}) {
  await connectMongo();
  
  // Check for existing booking (duplicate prevention)
  const existingBooking = await Booking.findOne({
    eventSlotId: input.eventSlotId,
    guestUserId: input.guestUserId,
    status: { $in: ["PAYMENT_PENDING", "CONFIRMED"] }
  });

  if (existingBooking) {
    throw new Error("You already have a booking for this event");
  }

  // Check total seats for user (max 2 seats per event)
  const existingBookings = await Booking.aggregate([
    {
      $match: {
        eventSlotId: input.eventSlotId,
        guestUserId: input.guestUserId,
        status: { $in: ["PAYMENT_PENDING", "CONFIRMED"] }
      }
    },
    { $group: { _id: null, total: { $sum: "$seats" } } }
  ]);

  const currentTotal = existingBookings[0]?.total || 0;
  if (currentTotal + input.seats > 2) {
    throw new Error("Maximum 2 seats per user per event");
  }

  // Get event first to check status
  const slotCheck = await EventSlot.findById(input.eventSlotId);
  if (!slotCheck) {
    throw new Error("Event not found");
  }
  
  const slotDoc = slotCheck as any;
  if (slotDoc.status !== "OPEN") {
    throw new Error("Event not available");
  }
  if (slotDoc.seatsRemaining < input.seats) {
    throw new Error("Not enough seats");
  }
  
  // Check if host is suspended
  const hostUser = await User.findById(slotDoc.hostUserId)
    .select({ status: 1 })
    .lean();
  const hostStatus = (hostUser as any)?.status || "ACTIVE";
  
  if (hostStatus === "SUSPENDED") {
    throw new Error("This event is not available because the host has been suspended. Please contact support for assistance.");
  }
  
  // Calculate new seats remaining
  const newSeatsRemaining = slotDoc.seatsRemaining - input.seats;
  const newStatus = newSeatsRemaining <= 0 ? "FULL" : "OPEN";
  
  // Atomic update with condition - use findOneAndUpdate with query conditions
  const slot = await EventSlot.findOneAndUpdate(
    {
      _id: input.eventSlotId,
      seatsRemaining: { $gte: input.seats },
      status: "OPEN"
    },
    {
      $inc: { seatsRemaining: -input.seats },
      $set: { status: newStatus }
    },
    { 
      new: true,
      runValidators: true
    }
  );
  
  if (!slot) {
    throw new Error("Not enough seats available or event is not open");
  }
  
  const updatedSlotDoc = slot as any;
  
  // Get guest type
  const guestProfile = await GuestProfile.findOne({ userId: input.guestUserId });
  const guestType = guestProfile?.guestType ?? "BASIC";
  
  // Calculate price
  const priceByType = updatedSlotDoc.priceByGuestType?.[guestType];
  const pricePerSeat = priceByType ?? updatedSlotDoc.basePricePerGuest ?? 0;
  
  if (pricePerSeat < 0) {
    // Rollback event seats if price validation fails
    await EventSlot.findByIdAndUpdate(
      input.eventSlotId,
      {
        $inc: { seatsRemaining: input.seats },
        $set: { status: slotDoc.seatsRemaining > 0 ? "OPEN" : slotDoc.status }
      }
    );
    throw new Error("Price cannot be negative");
  }
  
  const amountTotal = pricePerSeat * input.seats;
  
  try {
    // Create booking
    const booking = await Booking.create({
      eventSlotId: input.eventSlotId,
      venueId: updatedSlotDoc.venueId,
      hostUserId: updatedSlotDoc.hostUserId,
      guestUserId: input.guestUserId,
      guestTypeAtBooking: guestType,
      seats: input.seats,
      pricePerSeat,
      amountTotal,
      status: "PAYMENT_PENDING",
      guestName: input.guestName,
      guestMobile: input.guestMobile,
      guestAge: input.guestAge,
      guestGender: input.guestGender,
      additionalGuests: input.additionalGuests || []
    });
    
    // Create payment record
    const payment = await Payment.create({
      bookingId: booking._id,
      provider: "RAZORPAY",
      amount: amountTotal,
      currency: "INR",
      status: "PENDING"
    });

    await Booking.updateOne({ _id: booking._id }, { $set: { paymentId: payment._id } });

    // Free events: confirm immediately
    if (amountTotal <= 0) {
      await Payment.updateOne(
        { _id: payment._id },
        { $set: { status: "PAID", paidAt: new Date() } }
      );
      await Booking.updateOne({ _id: booking._id }, { $set: { status: "CONFIRMED" } });
      await finalizeBookingAfterPayment(String(booking._id));
      return {
        bookingId: String(booking._id),
        paymentId: String(payment._id),
        amountTotal,
        currency: "INR",
        status: "CONFIRMED",
        requiresPayment: false,
        razorpayOrderId: null,
        razorpayKeyId: null
      };
    }

    if (!isRazorpayConfigured()) {
      throw new Error(
        "Online payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local."
      );
    }

    const receipt = `bk${String(booking._id).replace(/[^a-zA-Z0-9]/g, "").slice(-20)}`.slice(0, 40);
    const order = await createRazorpayOrder({
      amountPaise: amountTotal,
      receipt,
      notes: {
        bookingId: String(booking._id),
        eventSlotId: String(input.eventSlotId)
      }
    });

    await Payment.updateOne(
      { _id: payment._id },
      { $set: { razorpayOrderId: order.id } }
    );

    return {
      bookingId: String(booking._id),
      paymentId: String(payment._id),
      amountTotal,
      currency: "INR",
      status: "PAYMENT_PENDING",
      requiresPayment: true,
      razorpayOrderId: order.id,
      razorpayKeyId: getRazorpayKeyIdPublic()
    };
  } catch (error) {
    // Rollback event seats if booking creation fails
    try {
      await EventSlot.findByIdAndUpdate(
        input.eventSlotId,
        {
          $inc: { seatsRemaining: input.seats },
          $set: { status: slotDoc.seatsRemaining > 0 ? "OPEN" : slotDoc.status }
        }
      );
    } catch (rollbackError) {
      console.error("Failed to rollback event seats:", rollbackError);
    }
    throw error;
  }
}
