# 🐟 Event Koi — Complete Event Management Platform

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)](https://www.mysql.com/)
[![TiDB Cloud](https://img.shields.io/badge/TiDB-Cloud-red)](https://tidbcloud.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Image_CDN-blue)](https://cloudinary.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**A production-ready, full-stack event management platform with 48+ database tables, real-time analytics, sponsorship management, advanced admin controls, and comprehensive social features.**

[Features](#-features) • [Tech Stack](#️-tech-stack) • [Database](#️-database-architecture) • [API Docs](#-api-documentation) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure)

</div>

---

## ✨ Features

### 🎫 Event Management
- Create, edit, and delete events with rich details (images, schedules, descriptions)
- Custom venue input or selection from curated venue database
- Multi-tier ticket types with inventory and capacity management
- Event status lifecycle: `DRAFT → PUBLISHED → CANCELLED`
- Event filtering by **category**, **search term**, and **organizer**
- Automatic masking of past/expired events

### 🎟️ Ticketing & QR Codes
- Unique QR code generated per ticket booking
- Mobile-friendly live QR ticket scanner (`/dashboard/scan`)
- Ticket status tracking: `VALID / USED / CANCELLED`
- Smart refund policy (full refund >7 days, 50% refund 2–7 days prior)
- Downloadable ticket history at `/dashboard/tickets`

### 👥 User System & Roles
| Role | Capabilities |
|------|-------------|
| **Admin** | Manage all users, verify organizers, access audit logs, system intelligence |
| **Organizer** | Create events, manage tickets, approve sponsors, view analytics |
| **Attendee** | Book tickets, send friend requests, apply for sponsorship, chat |

- Extended user profiles (bio, website, location, language, timezone)
- Profile image upload via Cloudinary
- Role upgrade requests (Attendee → Organizer) with document submission
- Two-factor authentication (2FA) support
- Organizer ID card & proof-of-legitimacy document upload

### 🤝 Social Features
- **Friend System:** Search users, send/accept/reject friend requests
- **Real-Time Chat:** Direct messaging between friends with polling
- **Event Posts:** Organizers post news & announcements with images
- **Reactions:** Like and comment on event posts
- **User Following:** Follow/unfollow system independent of friendship

### 💰 Sponsorship Management
- Apply to sponsor any event (open to all users)
- Tiered sponsorship packages (Partner / Bronze / Silver / Gold)
- Organizer approval workflow with logo and website tracking
- Sponsor revenue automatically reflected in event analytics

### 📊 Advanced Analytics
- **Real-time revenue** calculated live from Bookings and EventSponsorships
- **Sales Velocity** chart: tickets sold per day with animated bars
- **Ticket Sales Distribution** by ticket type (replaces mocked demographics)
- **Page view tracking**: increments on every event page visit
- **Organizer Est. Payout** calculated after 10% platform fee deduction
- Platform-level analytics for Admins at `/api/analytics/platform`

### 🔔 Notification System
- Instant alerts for new messages, friend requests, and event bookings
- 24-hour pre-event reminders for booked events
- New event broadcast notifications
- Real-time bell icon with unread count badge

### 🛡️ Admin Panel
- Full user management (ban, verify, role change)
- Organizer verification with document review
- Admin audit log of all privileged actions
- System logs viewer
- Platform revenue overview
- Report & moderation queue management
- Role management and permission system
- Sponsorship oversight across all events

### 🔍 Search & Discovery
- Global event search with real-time results
- Search history per user with dropdown recall
- Event recommendations engine
- Category-based filtering

### 📅 Additional Modules
- **Event Waitlist**: Join waitlist for fully-booked events
- **Event Schedule**: Multi-session/slot scheduling per event
- **Event Reviews**: Star ratings and text reviews per booking
- **Daily Metrics**: Platform-wide KPIs tracked daily (DailyMetrics table)
- **Payment Tracking**: Full payment records per booking
- **Refunds**: Automated refund records tied to cancellations
- **User Achievements**: Gamification badges and milestones
- **User Preferences**: Theme, notification, and privacy settings
- **Campaigns**: Organizer marketing campaign tracking

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router, Server Components)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS with custom design system
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **QR Code:** qrcode.react, html5-qrcode

### Backend
- **Runtime:** Node.js via Next.js API Routes
- **Database Driver:** `mysql2` (raw SQL for performance)
- **File Storage:** Cloudinary (images, documents)
- **Auth:** Session cookie + bcryptjs password hashing

### Database
- **Local Dev:** MySQL 8.0
- **Production:** TiDB Cloud (MySQL-compatible, serverless)
- **Tables:** 48 unique tables across 17 SQL migration files
- **Design:** 3NF normalized, foreign key constraints, enum types, indexed columns

### Infrastructure
- **Deployment:** Vercel (serverless)
- **CDN:** Cloudinary
- **Live:** [event-koi.vercel.app](https://event-koi.vercel.app)

### Key Libraries
| Library | Purpose |
|---------|---------|
| `uuid` | Unique ticket code generation |
| `bcryptjs` | Password hashing |
| `cloudinary` | Cloud image/document uploads |
| `mysql2` | MySQL connection pooling |
| `framer-motion` | UI animations |
| `lucide-react` | Icon system |
| `next/font` | Optimized Google Fonts |

---

## 🗄️ Database Architecture

Event Koi uses a comprehensive **relational database** with **48 unique tables** across multiple functional domains.

### Database Domains

| Domain | Tables |
|--------|--------|
| **Core** | Users, Events, Categories, Venues |
| **Ticketing** | Bookings, Tickets, TicketTypes, Payments, Refunds |
| **Social** | Friendships, Messages, UserFollowing |
| **Content** | Posts, PostLikes, PostComments, EventReviews |
| **Notifications** | Notifications |
| **Sponsorship** | Sponsors, SponsorshipPackages, EventSponsorships |
| **Admin** | AdminUsers, AdminRoles, AdminAuditLog, UserModeration, RoleRequests, ReportedContent |
| **Analytics** | EventAnalytics, UserAnalytics, DailyMetrics, EventRevenue, SearchHistory |
| **Extended** | UserProfiles, UserAchievements, UserPreferences, UserRecommendations |
| **Event Extended** | EventSchedule, EventWaitlist, EventTags |
| **System** | SystemLogs, PlatformFees |
| **Marketing** | Campaigns |

### Core Table Schemas

<details>
<summary><b>Users</b> — Central identity table</summary>

```sql
id, name, email, password, role (admin|organizer|attendee),
phone, profile_image, designation, is_verified,
organization_id_card, proof_document, created_at
```
</details>

<details>
<summary><b>Events</b> — Central event table</summary>

```sql
event_id, organizer_id (FK→Users), venue_id (FK→Venues),
category_id (FK→Categories), title, description,
start_time, end_time, status (DRAFT|PUBLISHED|CANCELLED),
listing_fee, is_listing_paid, cover_image, created_at
```
</details>

<details>
<summary><b>Bookings</b> — Ticket purchases</summary>

```sql
booking_id, user_id (FK→Users), event_id (FK→Events),
ticket_type_id (FK→TicketTypes), unique_code, status (VALID|USED|CANCELLED),
payment_amount, payment_method, payment_status, refund_amount, created_at
```
</details>

<details>
<summary><b>EventAnalytics</b> — Per-event page tracking</summary>

```sql
analytics_id, event_id (FK→Events), total_views, unique_visitors,
click_through_rate, conversion_rate, average_time_on_page,
source_breakdown (JSON), device_breakdown (JSON),
geographic_breakdown (JSON), captured_date
```
</details>

<details>
<summary><b>EventSponsorships</b> — Sponsorship ledger</summary>

```sql
sponsorship_id, event_id (FK→Events), sponsor_id (FK→Sponsors),
package_id (FK→SponsorshipPackages), amount_paid,
payment_status (Pending|Completed|Partial), contract_url,
logo_url, website_url, display_priority, created_at
```
</details>

### Design Principles
- ✅ **3NF Normalization** — No redundant data
- ✅ **Referential Integrity** — All foreign keys enforced
- ✅ **Indexed Queries** — Optimized for dashboard-scale reads
- ✅ **ENUM Types** — Constrained status fields
- ✅ **JSON Columns** — Flexible metadata (source/device/geo breakdown)
- ✅ **Timestamps** — Automatic `created_at` on all tables
- ✅ **Triggers** — Auto-update `EventRevenue` on booking changes

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (or TiDB Cloud account)
- npm or yarn
- Cloudinary account (free tier available)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/IsTu25/Event-Koi.git
cd Event-Koi
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**

Create `.env.local` in the root:
```env
# Database (TiDB Cloud or local MySQL)
DB_HOST=your_db_host
DB_PORT=4000
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=event_koi
DB_SSL=true

# Cloudinary (for image/document uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**4. Initialize the Database**

Run the SQL migration files in order from the `database/` folder:
```bash
# Run migrations in sequence (01 → 17)
mysql -u root -p event_koi < database/01_schema.sql
mysql -u root -p event_koi < database/02_seed.sql
# ... continue through all migration files
```

Or use the setup API endpoints after starting the server:
```
POST /api/setup/bookings
POST /api/setup/extended-tables
POST /api/setup/additional-tables
```

**5. Start Development Server**
```bash
npm run dev
```

**6. Access the Application**
```
http://localhost:3000
```

### Default Admin Account
```
Email:    admin@eventkoi.com
Password: admin123
```

### Deployment to Vercel

```bash
npm i -g vercel
vercel
```

Set all `.env.local` variables in **Vercel Dashboard → Settings → Environment Variables**.

---

## 📁 Project Structure

```
event-koi/
├── database/                    # SQL migration files (01–17)
│   ├── 01_schema.sql            # Core tables
│   ├── 08_analytics_reporting.sql
│   ├── 14_extended_tables.sql   # Extended user/event tables
│   ├── 15_additional_tables.sql # Achievements, preferences, etc.
│   ├── 16_extended_seed.sql     # Sample data
│   └── 17_triggers_procedures_fix.sql
├── public/
│   └── uploads/                 # Local uploaded files
├── src/
│   ├── app/
│   │   ├── api/                 # 60+ API route handlers
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── events/          # CRUD + Analytics
│   │   │   ├── bookings/        # Book, Cancel, Validate
│   │   │   ├── admin/           # Users, Roles, Audit, Intelligence
│   │   │   ├── analytics/       # Platform analytics
│   │   │   ├── friends/         # Friendship management
│   │   │   ├── messages/        # Direct messaging
│   │   │   ├── notifications/   # Notification system
│   │   │   ├── organizer/       # Campaigns, Sponsorships
│   │   │   ├── sponsors/        # Sponsor CRUD
│   │   │   ├── sponsorship-packages/
│   │   │   ├── user-profiles/   # Extended profile data
│   │   │   ├── user-achievements/
│   │   │   ├── user-preferences/
│   │   │   ├── user-following/  # Follow system
│   │   │   ├── search/          # Event search
│   │   │   ├── search-history/  # User search history
│   │   │   ├── recommendations/ # Event recommendations
│   │   │   ├── event-reviews/
│   │   │   ├── event-waitlist/
│   │   │   ├── event-schedule/
│   │   │   ├── payments/
│   │   │   ├── refunds/
│   │   │   ├── reported-content/
│   │   │   ├── posts/           # Event announcements + likes/comments
│   │   │   └── setup/           # DB initialization routes
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Main event listing with search history
│   │   │   ├── event/[id]/      # Event detail + Advanced Analytics modal
│   │   │   ├── tickets/         # My Tickets + QR codes
│   │   │   ├── profile/         # User profile + extended fields
│   │   │   ├── settings/        # Preferences, 2FA, privacy
│   │   │   ├── admin/           # Full admin panel
│   │   │   ├── campaigns/       # Organizer campaigns
│   │   │   ├── sponsorships/    # Sponsor dashboard
│   │   │   ├── scan/            # QR ticket scanner
│   │   │   └── create-event/    # Event creation wizard
│   │   ├── event/[id]/          # Public event page
│   │   ├── login/
│   │   └── register/
│   ├── components/              # Shared UI components
│   └── lib/
│       └── db.ts                # MySQL connection pool
├── README.md
└── package.json
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new user account |
| `POST` | `/api/auth/login` | Login and set session cookie |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | List events (`?search=`, `?category_id=`, `?organizer_id=`) |
| `POST` | `/api/events` | Create new event |
| `GET` | `/api/events/[id]` | Get event details (also tracks page view) |
| `PUT` | `/api/events/[id]` | Update event |
| `DELETE` | `/api/events/[id]` | Delete event |
| `GET` | `/api/events/[id]/analytics` | Advanced analytics (revenue, sales trend, views) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookings` | Get user's bookings (`?user_id=`) |
| `POST` | `/api/bookings` | Book a ticket |
| `POST` | `/api/bookings/cancel` | Cancel ticket with refund |
| `POST` | `/api/bookings/validate` | Validate QR code via scanner |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/friends` | Get all friendships |
| `POST` | `/api/friends` | Send friend request |
| `PUT` | `/api/friends` | Accept / reject request |
| `GET` | `/api/messages` | Get chat history |
| `POST` | `/api/messages` | Send message |
| `GET/POST/DELETE` | `/api/user-following` | Follow/unfollow users |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Fetch notifications (`?user_id=`) |
| `PUT` | `/api/notifications` | Mark as read |

### User & Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/PUT` | `/api/user/profile` | Basic profile (name, email, avatar) |
| `GET/PUT` | `/api/user-profiles` | Extended profile (bio, website, location, timezone) |
| `GET/POST` | `/api/user-achievements` | User achievement badges |
| `GET/PUT` | `/api/user-preferences` | Notification and privacy settings |
| `POST` | `/api/user/request-role` | Request organizer role upgrade |
| `POST` | `/api/users/2fa` | Two-factor auth setup |

### Sponsorships
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/sponsors` | Manage sponsor entities |
| `GET/POST` | `/api/sponsorship-packages` | Sponsorship tiers |
| `GET/POST/PUT` | `/api/organizer/sponsorships` | Organizer approval workflow |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/PUT` | `/api/admin/users` | User management + role assignment |
| `GET/POST` | `/api/admin/verify-user` | Organizer verification queue |
| `GET` | `/api/admin/audit-log` | Admin action history |
| `GET` | `/api/admin/system-logs` | System log viewer |
| `GET` | `/api/admin/intelligence` | Platform-wide KPI intelligence |
| `GET/PUT` | `/api/admin/moderation` | Content moderation queue |
| `GET/POST` | `/api/admin/roles` | Role and permission management |
| `GET` | `/api/admin/requests` | Pending role requests |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/platform` | Platform daily metrics |
| `GET` | `/api/events/[id]/analytics` | Per-event advanced analytics |

### Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search` | Search events |
| `GET/DELETE` | `/api/search-history` | User search history |
| `GET` | `/api/recommendations` | Personalized event recommendations |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ as an RDBMS course project — demonstrating real-world relational database design with 48+ interconnected tables, triggers, stored procedures, and a full-stack production application.

</div>
