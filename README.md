# LocalSocialCalendar

A production-ready Next.js 14+ full-stack social calendar application for discovering local events and connecting with your community.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** tRPC, Zod validation
- **Database:** Neon Postgres with Drizzle ORM
- **Authentication:** Clerk
- **State Management:** TanStack React Query

## Project Status

✅ **Phase 1 Complete:** Foundation & Database Setup
- Project initialized with Next.js, TypeScript, and all dependencies
- Complete database schema implemented with 6 tables (users, businesses, events, follows, rsvps, friends)
- Drizzle ORM configured with migrations support
- Environment configuration set up

🚧 **Next Steps:** See implementation guide below

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Neon](https://neon.tech) database account
- A [Clerk](https://clerk.com) account for authentication

### 1. Clone and Install

```bash
cd /Users/lukeheary/Documents/Coding/SocialCal
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database - Get from https://neon.tech
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Clerk Authentication - Get from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string
3. Enable connection pooling in the Neon dashboard (Settings → Connection Pooling)
4. Add the connection string to `.env.local` as `DATABASE_URL`

### 4. Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Copy the publishable key and secret key to `.env.local`
3. Configure the webhook:
   - Go to Webhooks in the Clerk Dashboard
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk` (for local dev, use ngrok or similar)
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the webhook secret to `.env.local`

### 5. Generate and Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# (Optional) Open Drizzle Studio to view your database
npm run db:studio
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
/Users/lukeheary/Documents/Coding/SocialCal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   └── api/                # API routes
│   │       ├── trpc/           # tRPC endpoints (TO BE CREATED)
│   │       └── webhooks/       # Clerk webhook (TO BE CREATED)
│   │
│   ├── server/                 # Backend logic
│   │   ├── db/
│   │   │   ├── schema.ts       # ✅ Database schema (COMPLETE)
│   │   │   ├── index.ts        # ✅ Drizzle client (COMPLETE)
│   │   │   └── migrate.ts      # ✅ Migration runner (COMPLETE)
│   │   │
│   │   └── trpc/               # tRPC setup (TO BE CREATED)
│   │       ├── init.ts         # tRPC initialization
│   │       ├── context.ts      # tRPC context
│   │       ├── root.ts         # Root router
│   │       └── routers/        # API routers
│   │
│   ├── lib/                    # Shared utilities (TO BE CREATED)
│   │   ├── trpc.ts             # Client-side tRPC
│   │   └── utils.ts            # Utility functions
│   │
│   └── components/             # React components (TO BE CREATED)
│       ├── ui/                 # shadcn/ui components
│       └── providers/          # Context providers
│
├── drizzle.config.ts           # ✅ Drizzle configuration (COMPLETE)
├── .env.example                # ✅ Environment template (COMPLETE)
├── package.json                # ✅ Dependencies (COMPLETE)
└── README.md                   # This file
```

## Database Schema

The application uses 6 main tables:

### 1. **users**
- Synced from Clerk via webhooks
- Fields: id (Clerk ID), email, firstName, lastName, imageUrl

### 2. **businesses**
- Business profiles created by users
- Fields: slug, name, description, city, state, website, instagram, createdByUserId
- Unique slug for URLs: `/business/[slug]`

### 3. **events**
- Event listings (can be associated with a business or standalone)
- Fields: title, description, startAt, endAt, venueName, address, city, state, category, visibility
- Categories: music, food, art, sports, community, nightlife, other
- Visibility: public or private

### 4. **follows**
- User follows business relationship
- Unique constraint: (userId, businessId)

### 5. **rsvps**
- User RSVP to events
- Status: going, interested, not_going
- Unique constraint: (userId, eventId)

### 6. **friends**
- Friend connections between users
- Status: pending, accepted
- Bidirectional unique constraints to prevent duplicates

## Implementation Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Next.js project setup
- [x] All dependencies installed
- [x] Database schema defined
- [x] Drizzle ORM configured
- [x] Environment configuration

### 🚧 Phase 2: Authentication & Backend (NEXT)

1. **Create Clerk Middleware** (`src/middleware.ts`)
   - Protect all routes except public ones
   - Configure Clerk with Next.js App Router

2. **Create Clerk Webhook** (`src/app/api/webhooks/clerk/route.ts`)
   - Sync Clerk users to local database
   - Handle user.created, user.updated, user.deleted events

3. **Set Up tRPC Infrastructure**
   - `src/server/trpc/init.ts` - tRPC initialization with protected procedures
   - `src/server/trpc/context.ts` - Context with Clerk auth + DB
   - `src/server/trpc/root.ts` - Root router

4. **Implement API Routers**
   - `src/server/trpc/routers/business.ts` - Business CRUD + follow/unfollow
   - `src/server/trpc/routers/event.ts` - Event CRUD + RSVP + filtering
   - `src/server/trpc/routers/friends.ts` - Friend requests + search

5. **Create tRPC HTTP Handler** (`src/app/api/trpc/[trpc]/route.ts`)

### 📋 Phase 3: Frontend Infrastructure

1. **Set Up tRPC Client**
   - `src/lib/trpc.ts` - Create tRPC React hooks
   - `src/components/providers/trpc-provider.tsx` - React Query provider

2. **Update Root Layout** (`src/app/layout.tsx`)
   - Wrap with ClerkProvider and TRPCProvider

3. **Create Utility Functions** (`src/lib/utils.ts`)
   - `cn()` for Tailwind class merging
   - Date formatting helpers
   - Slug generation

4. **Install shadcn/ui Components**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card input textarea select label dialog dropdown-menu badge avatar calendar popover separator tabs toast form
   ```

### 📱 Phase 4: Pages & Features

1. **Home Page** (`src/app/page.tsx`)
   - 7-day calendar view
   - Filter by following/friends going
   - Event cards with quick RSVP

2. **Business Pages**
   - `src/app/business/[slug]/page.tsx` - Business profile
   - `src/app/business/new/page.tsx` - Create business form
   - `src/app/business/[slug]/events/new/page.tsx` - Create event form

3. **Event Page** (`src/app/event/[id]/page.tsx`)
   - Event details
   - RSVP buttons
   - Attendee list

4. **Friends Page** (`src/app/friends/page.tsx`)
   - Friend list
   - Pending requests
   - User search

5. **Authentication Pages**
   - `src/app/sign-in/[[...sign-in]]/page.tsx`
   - `src/app/sign-up/[[...sign-up]]/page.tsx`

### 🎨 Phase 5: Polish & Testing

1. Add loading states and error handling
2. Implement toast notifications
3. Create seed script with sample data
4. Test all user flows
5. Mobile responsive design
6. Add weekly digest job stub (`src/server/jobs/weekly-digest.ts`)

### 🚀 Phase 6: Deployment

1. Deploy to Vercel
2. Configure production environment variables
3. Set up Clerk production instance
4. Run production migrations
5. Test production deployment

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema changes to database (dev only)
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:seed` - Seed database with sample data (to be created)

## Key Features (MVP)

### For Users
- ✅ Sign up/sign in with Clerk
- 📅 View 7-day calendar of local events
- 🔔 Follow businesses to see their events
- ✅ RSVP to events (Going/Interested/Not Going)
- 👥 Connect with friends
- 🔍 Filter events by followed businesses or friends attending

### For Business Owners
- 🏢 Create business profile with slug
- 📝 Create events for their business
- 📊 View follower count
- 🔗 Add website and Instagram links

### Technical Features
- 🔐 Secure authentication with Clerk
- 🗄️ Type-safe database queries with Drizzle
- 📡 End-to-end type safety with tRPC
- ✅ Input validation with Zod
- 🎨 Beautiful UI with Tailwind CSS + shadcn/ui
- 📱 Mobile responsive design
- ⚡ Server-side rendering with Next.js App Router

## Future Enhancements

- 📧 Weekly digest emails (stub created)
- 🔔 Push notifications
- 🗺️ Map view for events
- 🔍 Advanced search and filtering
- 💬 Event comments and discussion
- 📸 Event photo uploads
- 📊 Business analytics dashboard
- 🔄 Recurring events
- 🏷️ Event tags and categories expansion

## Database Indexes

The schema includes strategic indexes for performance:
- Foreign keys (userId, businessId, eventId)
- Query filters (startAt, visibility, status, category)
- Unique constraints (slug, user+business combinations)
- Composite indexes (startAt+visibility for common queries)

## Security Considerations

- All mutations require authentication (protected tRPC procedures)
- Business owners can only create events for their own businesses
- Friend requests have bidirectional unique constraints
- Clerk handles password security and session management
- Environment variables for all sensitive data
- Input validation on all API endpoints with Zod

## Need Help?

- **Clerk Documentation:** https://clerk.com/docs
- **Drizzle ORM:** https://orm.drizzle.team/docs/overview
- **tRPC:** https://trpc.io/docs
- **Next.js:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com

## License

MIT

---

**Built with ❤️ using Next.js, tRPC, Drizzle, and Clerk**
