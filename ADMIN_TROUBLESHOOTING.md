# Admin Login Troubleshooting Guide

## Quick Test

To verify admin setup is working, visit the test endpoint:

```
GET /api/admin/test
```

This will show:
- Database connection status
- Admin model initialization status
- Number of admin users
- List of existing admin users
- Instructions for setup

## Common Issues & Solutions

### 401 Unauthorized - "No admin users found"

**Problem:** Admin users haven't been created yet.

**Solution:**
```bash
curl -X POST http://localhost:3000/api/admin/init
```

Or visit `http://localhost:3000/api/admin/init` with POST method.

**What it does:** Creates 3 default admin users:
- `superadmin` / `SuperAdmin@2024!`
- `moderator` / `Moderator@2024!`
- `analyst` / `Analyst@2024!`

---

### 401 Unauthorized - "Admin user not found"

**Problem:** Username doesn't exist.

**Possible causes:**
- Wrong username (case-sensitive)
- Admin users weren't created
- Username was changed/deleted

**Solution:**
1. Check test endpoint: `GET /api/admin/test` to see existing users
2. Re-initialize if needed: `POST /api/admin/init`
3. Verify username is exact (case-sensitive)

---

### 401 Unauthorized - "Invalid password"

**Problem:** Password is incorrect.

**Possible causes:**
- Wrong password
- Password was changed
- Copy/paste included extra spaces

**Solution:**
1. Verify password is exact (case-sensitive, special characters)
2. Try default password from credentials document
3. Check for extra spaces when copying

---

### 401 Unauthorized - "Admin account is inactive"

**Problem:** Admin user exists but is marked as inactive.

**Solution:**
- Contact super administrator to reactivate account
- Or manually update in database: `db.admins.updateOne({username: "username"}, {$set: {isActive: true}})`

---

### 500 Server Error - "Admin model not initialized"

**Problem:** Admin model failed to load.

**Possible causes:**
- Import error
- MongoDB connection issue
- Model file not found

**Solution:**
1. Check server logs for import errors
2. Verify MongoDB connection: `GET /api/admin/test`
3. Restart server
4. Check that `src/server/models/Admin.ts` exists and exports correctly

---

### 500 Server Error - Database Connection Issues

**Problem:** Can't connect to MongoDB.

**Solution:**
1. Verify `MONGODB_URI` environment variable is set
2. Check MongoDB is running and accessible
3. Verify connection string format
4. Test connection: `GET /api/admin/test`

---

## Step-by-Step Setup

1. **Start your server**
   ```bash
   npm run dev
   ```

2. **Verify database connection**
   ```bash
   curl http://localhost:3000/api/admin/test
   ```
   Check that `database.status` is "CONNECTED"

3. **Initialize admin users**
   ```bash
   curl -X POST http://localhost:3000/api/admin/init
   ```
   Should return success with 3 admin users created

4. **Verify admin users exist**
   ```bash
   curl http://localhost:3000/api/admin/test
   ```
   Check that `admins.count` is 3

5. **Try login**
   ```bash
   curl -X POST http://localhost:3000/api/admin/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"superadmin","password":"SuperAdmin@2024!"}'
   ```
   Should return accessToken and admin info

6. **Login via UI**
   - Navigate to `http://localhost:3000/admin/login`
   - Enter credentials
   - Should redirect to dashboard

---

## Error Messages Reference

| Error Message | HTTP Code | Meaning | Solution |
|--------------|-----------|---------|----------|
| "No admin users found" | 500 | No admins in database | Call `/api/admin/init` |
| "Admin user not found with username: X" | 401 | Username doesn't exist | Check username or create users |
| "Invalid password for username: X" | 401 | Wrong password | Verify password |
| "Admin account is inactive" | 401 | Account disabled | Contact super admin |
| "Admin model not initialized" | 500 | Model import failed | Check server logs, restart |

---

## Debugging Commands

**Check database status:**
```bash
curl http://localhost:3000/api/admin/test
```

**List admin users (after login):**
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Create admin users:**
```bash
curl -X POST http://localhost:3000/api/admin/init
```

**Test login:**
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"SuperAdmin@2024!"}'
```

---

## Still Having Issues?

1. Check server console logs for detailed error messages
2. Verify MongoDB is running: `mongosh` or check your MongoDB service
3. Verify environment variables are set correctly
4. Try restarting the server
5. Check that all files are saved and compiled correctly
