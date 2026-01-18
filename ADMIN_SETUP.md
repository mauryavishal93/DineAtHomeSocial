# Admin Panel Setup Guide

## Admin Authentication System

The admin panel uses a **separate authentication system** with its own collection (`Admin`) and username/password login.

## Admin Roles & Permissions

### 1. SUPER_ADMIN
- **Full access** to all features
- Can view dashboard, manage users, verify users, suspend users
- Can view and manage events
- Can view revenue and manage settings
- Can view analytics and manage other admins

### 2. MODERATOR
- **Limited access** for content moderation
- Can view dashboard and analytics
- Can manage users (verify, suspend)
- Can view and manage events
- **Cannot** view revenue or manage settings
- **Cannot** manage other admins

### 3. ANALYST
- **Read-only access** for analytics
- Can view dashboard and analytics
- Can view events (read-only)
- Can view revenue
- **Cannot** manage users, verify users, or suspend users
- **Cannot** manage events or settings
- **Cannot** manage other admins

## Default Admin Users

After running the initialization endpoint, the following admin users will be created:

### 1. Super Administrator
- **Username:** `superadmin`
- **Password:** `SuperAdmin@2024!`
- **Role:** SUPER_ADMIN
- **Email:** superadmin@dineathome.com
- **Full Name:** Super Administrator

### 2. Moderator
- **Username:** `moderator`
- **Password:** `Moderator@2024!`
- **Role:** MODERATOR
- **Email:** moderator@dineathome.com
- **Full Name:** Content Moderator

### 3. Analyst
- **Username:** `analyst`
- **Password:** `Analyst@2024!`
- **Role:** ANALYST
- **Email:** analyst@dineathome.com
- **Full Name:** Data Analyst

## Initialization

To create the admin users, make a POST request to:

```
POST /api/admin/init
```

Or use curl:

```bash
curl -X POST http://localhost:3000/api/admin/init
```

This will create all three admin users. If a user already exists, it will skip that user.

## Login

1. Navigate to `/admin/login`
2. Enter username and password
3. You'll be redirected to `/admin` dashboard

## Security Features

- **Separate collection:** Admin users are stored in `Admin` collection (not `User`)
- **Password hashing:** Passwords are hashed using bcrypt
- **JWT tokens:** Secure token-based authentication
- **Role-based permissions:** Each role has specific permissions
- **Last login tracking:** Tracks when each admin last logged in
- **Active status:** Admins can be deactivated

## API Endpoints

### Admin Authentication
- `POST /api/admin/auth/login` - Login with username/password
- `GET /api/admin/auth/me` - Get current admin info

### Admin Panel (requires admin auth)
- `GET /api/admin/analytics` - Dashboard analytics
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users` - Update user status
- `POST /api/admin/users/verify` - Verify user
- `GET /api/admin/events` - List events
- `GET /api/admin/revenue` - Revenue breakdown

## Important Notes

⚠️ **Change default passwords** after first login in production!

⚠️ The initialization endpoint can be called multiple times safely - it will skip existing users.

⚠️ Admin authentication is completely separate from regular user authentication.
