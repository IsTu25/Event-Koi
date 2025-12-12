# Event Koi 🐟

A comprehensive Event Management System built with Next.js, MySQL, and TailwindCSS.

## Features implemented:
- 🔐 **User Authentication** (Admin, Organizer, Attendee)
- 📅 **Event Management** (Create, Edit, Delete Events)
- 🎟️ **Ticketing System** with QR Codes
- 🤝 **Friendship & Social Graph**
- 💬 **Real-time Chat**
- 🔔 **Notifications System**
- 📢 **Event Blogs & Updates**
- 🛡️ **Role-Based Access Control**
- 📷 **Ticket Scanning Support**

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup
Ensure you have MySQL running and update `src/lib/db.ts` with your credentials.
This project uses API routes `/api/setup/...` to initialize tables dynamically.
