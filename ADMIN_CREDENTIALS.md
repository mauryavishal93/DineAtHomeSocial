# Admin Panel Credentials

## ⚠️ IMPORTANT: Change these passwords after first login in production!

## Default Admin Users

### 1. Super Administrator (Full Access)
- **Username:** `superadmin`
- **Password:** `SuperAdmin@2024!`
- **Role:** SUPER_ADMIN
- **Access:** Full access to all features
  - ✅ View dashboard & analytics
  - ✅ Manage users (verify, suspend, activate)
  - ✅ View and manage events
  - ✅ View revenue
  - ✅ Manage settings
  - ✅ Manage other admins

### 2. Moderator (Content Moderation)
- **Username:** `moderator`
- **Password:** `Moderator@2024!`
- **Role:** MODERATOR
- **Access:** Limited to moderation tasks
  - ✅ View dashboard & analytics
  - ✅ Manage users (verify, suspend)
  - ✅ View and manage events
  - ❌ Cannot view revenue
  - ❌ Cannot manage settings
  - ❌ Cannot manage other admins

### 3. Analyst (Read-Only Analytics)
- **Username:** `analyst`
- **Password:** `Analyst@2024!`
- **Role:** ANALYST
- **Access:** Read-only analytics access
  - ✅ View dashboard & analytics
  - ✅ View events (read-only)
  - ✅ View revenue
  - ❌ Cannot manage users
  - ❌ Cannot verify or suspend users
  - ❌ Cannot manage events
  - ❌ Cannot manage settings
  - ❌ Cannot manage other admins

## How to Initialize

1. Start your server
2. Make a POST request to `/api/admin/init`:

```bash
curl -X POST http://localhost:3000/api/admin/init
```

Or visit the endpoint in your browser/Postman.

## Login

1. Navigate to: `http://localhost:3000/admin/login`
2. Enter username and password
3. You'll be redirected to the admin dashboard

## Security Notes

- Admin users are stored in a **separate `Admin` collection** (not the regular `User` collection)
- Passwords are hashed using bcrypt
- Each admin role has specific permissions
- Admin authentication is completely separate from regular user authentication
- **Change default passwords immediately in production!**
