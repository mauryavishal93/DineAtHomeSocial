# Notification Cleanup for Ended Events and Chats

## Overview
The system automatically deletes notifications related to events and temporary chats once the event has ended. This keeps the notification list clean and removes outdated information.

## How It Works

### 1. Automatic Cleanup on Notification Fetch
When users fetch their notifications via `/api/notifications`, the system:
- Checks if any notifications are related to events that have ended
- Filters out notifications for ended events from the response
- Deletes those notifications from the database in the background
- Only returns notifications for active/upcoming events

### 2. Manual Cleanup Endpoints

#### Admin Endpoint
**POST `/api/admin/cleanup-notifications`**
- Requires admin authentication
- Can clean up all ended events or a specific event
- Query params:
  - `eventId` (optional): Clean up notifications for a specific event

#### Public Endpoint (for cron jobs)
**POST `/api/cleanup-notifications?secret=YOUR_SECRET`**
- Requires a secret key for security
- Can be called by external cron services
- Query params:
  - `secret` (required): Secret key from `CLEANUP_SECRET` environment variable
  - `eventId` (optional): Clean up notifications for a specific event

### 3. What Gets Deleted

When an event ends (event `endAt` < current time), the following notifications are deleted:
- **Chat notifications** (`NEW_MESSAGE` type) for that event
- **Event reminders** (`EVENT_REMINDER` type)
- **Event cancellation notifications** (`EVENT_CANCELLED` type)
- **Booking notifications** related to that event
- **Any other notification** with `relatedEventId` pointing to the ended event

## Environment Setup

Add to your `.env.local`:
```env
CLEANUP_SECRET=your-secret-key-here
```

## Scheduled Cleanup

To run automatic cleanup periodically, you can:

1. **Use a cron service** (like cron-job.org, EasyCron, etc.):
   - Set up a POST request to: `https://yourdomain.com/api/cleanup-notifications?secret=YOUR_SECRET`
   - Schedule it to run daily or hourly

2. **Use server cron** (if available):
   ```bash
   # Run daily at 2 AM
   0 2 * * * curl -X POST "https://yourdomain.com/api/cleanup-notifications?secret=YOUR_SECRET"
   ```

3. **Manual cleanup** (Admin only):
   - Call `/api/admin/cleanup-notifications` from the admin panel
   - Or use the admin API directly

## Implementation Details

### Service Functions

**`cleanupEndedEventNotifications()`**
- Finds all events where `endAt < now`
- Deletes all notifications with `relatedEventId` matching those events
- Returns count of deleted notifications and events processed

**`cleanupEventNotifications(eventId)`**
- Cleans up notifications for a specific event
- Only deletes if the event has actually ended
- Returns count of deleted notifications

### Database Queries

The cleanup uses efficient MongoDB queries:
- Finds ended events: `EventSlot.find({ endAt: { $lt: now } })`
- Deletes notifications: `Notification.deleteMany({ relatedEventId: { $in: eventIds } })`

## Benefits

1. **Clean Notification List**: Users only see relevant, active notifications
2. **Reduced Database Size**: Old notifications are automatically removed
3. **Better Performance**: Fewer notifications to query and display
4. **Automatic**: No manual intervention needed once configured

## Testing

To test the cleanup:
1. Create a test event with an end time in the past
2. Create some notifications for that event
3. Call the cleanup endpoint
4. Verify notifications are deleted

## Notes

- Cleanup happens automatically when users fetch notifications (background deletion)
- Manual cleanup endpoints are available for bulk operations
- Notifications are permanently deleted (not archived)
- Only notifications for events that have actually ended are deleted
