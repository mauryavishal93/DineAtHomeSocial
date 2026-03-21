import { Types } from "mongoose";

/**
 * Chat is scoped per booking (host ↔ primary guest). Legacy messages had no bookingId
 * and used a single event-wide thread (bug: all guests saw all messages).
 * New messages always set bookingId. Legacy rows match only when sender is host or this guest.
 */
export function buildChatThreadFilter(params: {
  eventSlotId: string;
  bookingId: string;
  hostUserId: string;
  guestUserId: string;
}) {
  const eventSlotId = new Types.ObjectId(params.eventSlotId);
  const bookingId = new Types.ObjectId(params.bookingId);
  const hostUserId = new Types.ObjectId(params.hostUserId);
  const guestUserId = new Types.ObjectId(params.guestUserId);

  return {
    eventSlotId,
    isDeleted: false,
    $or: [
      { bookingId },
      {
        bookingId: { $exists: false },
        senderUserId: { $in: [hostUserId, guestUserId] }
      }
    ]
  };
}
