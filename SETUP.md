# 🚀 Event Koi - Complete Setup Guide

## Prerequisites
- ✅ Node.js (v18+)
- ✅ MySQL (v8.0+)
- ✅ npm or yarn

## 📦 Step 1: Install Dependencies

```bash
cd "/Users/md.isfakiqbalchowdhury/Documents/rdbms project/event-koi"
npm install
```

## 🗄️ Step 2: Database Setup

### Option A: Quick Setup (Recommended)

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS event_koi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Run all SQL files in order
mysql -u root -p event_koi < database/01_schema.sql
mysql -u root -p event_koi < database/02_procedures_triggers.sql
mysql -u root -p event_koi < database/03_views_indexes.sql
mysql -u root -p event_koi < database/04_seed.sql

# 3. Optional: Advanced features
mysql -u root -p event_koi < database/06_advanced_features.sql
mysql -u root -p event_koi < database/07_performance_optimization.sql

# 4. Optional: Extended seed data (for even more data)
mysql -u root -p event_koi < database/04_seed_extended.sql
```

### Option B: Interactive MySQL

```bash
mysql -u root -p

# Then run these commands:
CREATE DATABASE IF NOT EXISTS event_koi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_koi;
source database/01_schema.sql;
source database/02_procedures_triggers.sql;
source database/03_views_indexes.sql;
source database/04_seed.sql;
exit;
```

## ⚙️ Step 3: Configure Database Connection

Your database connection is already configured in `src/lib/db.ts`:
- Host: localhost
- User: root
- Password: (empty)
- Database: event_koi

If you need to change these, edit `src/lib/db.ts`.

## 🏃 Step 4: Run the Application

```bash
npm run dev
```

The application will start at: **http://localhost:3000**

## 🧪 Step 5: Verify Setup

### Check Database Tables
```bash
mysql -u root -p event_koi -e "SHOW TABLES;"
```

You should see 13 tables:
- Users
- Categories
- Venues
- Events
- TicketTypes
- Bookings
- Sponsors
- EventPosts
- PostLikes
- PostComments
- Friendships
- Messages
- Notifications

### Check Sample Data
```bash
mysql -u root -p event_koi -e "SELECT COUNT(*) as user_count FROM Users;"
mysql -u root -p event_koi -e "SELECT COUNT(*) as event_count FROM Events;"
mysql -u root -p event_koi -e "SELECT COUNT(*) as booking_count FROM Bookings;"
```

Expected counts:
- Users: 50
- Events: 30
- Bookings: 400+

## 🎯 Step 6: Test the Application

### 1. Visit Homepage
http://localhost:3000

### 2. Register a New User
http://localhost:3000/register

### 3. Login
http://localhost:3000/login

Test credentials (from seed data):
- **Admin:**
  - Email: admin@eventkoi.com
  - Password: password (you'll need to hash this)

- **Organizer:**
  - Email: tech@events.bd
  - Password: password

- **Attendee:**
  - Email: john.doe@email.com
  - Password: password

### 4. Explore Features
- Dashboard: http://localhost:3000/dashboard
- My Tickets: http://localhost:3000/dashboard/tickets
- Profile: http://localhost:3000/dashboard/profile
- Create Event: http://localhost:3000/dashboard/create-event
- Scan Tickets: http://localhost:3000/dashboard/scan

## 📊 Step 7: Test Advanced Features

### Test Stored Procedures
```sql
-- Book a ticket
CALL sp_BookTicket(18, 1, 1, @booking_id, @unique_code, @status);
SELECT @booking_id, @unique_code, @status;

-- Get event statistics
CALL sp_GetEventStats(1);

-- Get user activity
CALL sp_GetUserActivity(18);
```

### Test Views
```sql
-- Popular events
SELECT * FROM vw_PopularEvents LIMIT 10;

-- Revenue report
SELECT * FROM vw_RevenueReport;

-- Organizer performance
SELECT * FROM vw_OrganizerPerformance LIMIT 10;
```

### Test Analytics API
```bash
# Event performance
curl http://localhost:3000/api/analytics?type=event_performance

# User engagement
curl http://localhost:3000/api/analytics?type=user_engagement

# Revenue analysis
curl http://localhost:3000/api/analytics?type=revenue_analysis
```

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Check database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'event_koi';"
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### MySQL Password Issues
If you have a MySQL password, update `src/lib/db.ts`:
```typescript
password: 'your_mysql_password',
```

## 📁 Project Structure

```
event-koi/
├── database/               # All SQL files
│   ├── 01_schema.sql
│   ├── 02_procedures_triggers.sql
│   ├── 03_views_indexes.sql
│   ├── 04_seed.sql
│   ├── 04_seed_extended.sql
│   ├── 05_complex_queries.sql
│   ├── 06_advanced_features.sql
│   └── 07_performance_optimization.sql
├── src/
│   ├── app/               # Next.js pages
│   │   ├── api/          # API routes
│   │   └── dashboard/    # Dashboard pages
│   └── lib/              # Utilities
│       └── db.ts         # Database connection
├── public/               # Static files
└── README.md            # Project documentation
```

## 🎉 Success!

If everything is working, you should see:
- ✅ Application running on http://localhost:3000
- ✅ Database with 13 tables
- ✅ 400+ bookings, 50 users, 30 events
- ✅ All features functional

## 📚 Next Steps

1. **Explore the Dashboard** - Browse events, book tickets
2. **Test QR Scanning** - Use the scan feature for tickets
3. **Try Analytics** - Check the analytics API endpoints
4. **Review Database** - Explore stored procedures and views
5. **Read Documentation** - Check `database/README.md` for SQL details

---

**Need help?** Check the main README.md or database/README.md for more details!
