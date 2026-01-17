import { connectMongo } from "@/server/db/mongoose";
import { EventSlot } from "@/server/models/EventSlot";
import { Booking } from "@/server/models/Booking";
import { Payment } from "@/server/models/Payment";
import { GuestProfile } from "@/server/models/GuestProfile";

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

  const slot = await EventSlot.findById(input.eventSlotId);
  if (!slot) throw new Error("Event not found");
  if ((slot as any).status !== "OPEN") throw new Error("Event not available");
  if ((slot as any).seatsRemaining < input.seats) throw new Error("Not enough seats");

  const guestProfile = await GuestProfile.findOne({ userId: input.guestUserId });
  const guestType = guestProfile?.guestType ?? "BASIC";

  // Calculate price
  const priceByType = (slot as any).priceByGuestType?.[guestType];
  const pricePerSeat = priceByType ?? (slot as any).basePricePerGuest ?? 0;
  const amountTotal = pricePerSeat * input.seats;

  // Create booking
  const booking = await Booking.create({
    eventSlotId: input.eventSlotId,
    venueId: (slot as any).venueId,
    hostUserId: (slot as any).hostUserId,
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

  // Create payment record (Razorpay integration would create order here)
  const payment = await Payment.create({
    bookingId: (booking as any)._id,
    provider: "RAZORPAY",
    amount: amountTotal,
    currency: "INR",
    status: "PENDING"
  });

  // Decrement seats
  (slot as any).seatsRemaining -= input.seats;
  if ((slot as any).seatsRemaining <= 0) {
    (slot as any).status = "FULL";
  }
  await slot.save();

  return {
    bookingId: String((booking as any)._id),
    paymentId: String((payment as any)._id),
    amountTotal,
    currency: "INR",
    status: "PAYMENT_PENDING"
  };
}
