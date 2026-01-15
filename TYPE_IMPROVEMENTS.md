# Type System Improvements

## Overview
Simplified and centralized type definitions by using tRPC's `RouterOutputs` to derive types directly from the API router, eliminating hardcoded duplicate type definitions.

## Changes Made

### 1. Created Central Types File
**File:** `src/types/trpc.ts`

Exports all commonly used types derived from tRPC router outputs:
- `RouterOutputs` - Base type containing all router outputs
- `EventListItem` - Individual event from list queries
- `EventDetail` - Detailed event with full RSVP data
- `CurrentUser` - Authenticated user data
- `BusinessDetail` - Business with events and followers
- `BusinessListItem` - Business from list queries

### 2. Updated Components

#### EventCardGrid Component
**File:** `src/components/events/event-card-grid.tsx`

**Before:**
```typescript
interface EventCardGridProps {
  events: Array<{
    id: string;
    name: string;
    description: string | null;
    // ... 30+ lines of hardcoded type definitions
  }>;
}
```

**After:**
```typescript
import { type EventListItem } from "@/types/trpc";

interface EventCardGridProps {
  events: EventListItem[];
}
```

#### EventCard Component
**File:** `src/components/calendar/event-card.tsx`

**Before:**
```typescript
interface EventCardProps {
  event: {
    id: string;
    title: string;
    imageUrl: string | null;
    // ... 20+ lines of hardcoded type definitions
  };
}
```

**After:**
```typescript
import { type EventListItem } from "@/types/trpc";

interface EventCardProps {
  event: EventListItem;
}
```

### 3. Enhanced trpc.ts
**File:** `src/lib/trpc.ts`

Added RouterOutputs export for convenient access throughout the app.

## Benefits

### 1. **Single Source of Truth**
- Types are automatically derived from the backend router
- No manual type definitions that can drift from reality
- Changes to router outputs automatically propagate to frontend

### 2. **Type Safety**
- Compile-time errors if backend types change
- No possibility of mismatched types between frontend and backend
- IDE autocomplete reflects actual API structure

### 3. **Maintainability**
- Reduced code duplication (eliminated ~50+ lines of type definitions)
- Easy to add new derived types as needed
- Clear documentation of available types

### 4. **Developer Experience**
- Less boilerplate when creating new components
- Faster development with accurate autocomplete
- Easier onboarding for new developers

## Usage Examples

### Using Event Types
```typescript
import { type EventListItem } from "@/types/trpc";

function MyComponent({ event }: { event: EventListItem }) {
  // Full type safety and autocomplete
  return <div>{event.title}</div>;
}
```

### Using User Types
```typescript
import { type CurrentUser } from "@/types/trpc";

function UserProfile({ user }: { user: CurrentUser }) {
  return <div>{user.firstName} {user.lastName}</div>;
}
```

### Using Business Types
```typescript
import { type BusinessDetail } from "@/types/trpc";

function BusinessPage({ business }: { business: BusinessDetail }) {
  return <div>{business.name}</div>;
}
```

## Future Improvements

Consider adding more derived types as needed:
- Friend request types
- Notification types
- RSVP types
- Search result types

All these can be added to `src/types/trpc.ts` using the same pattern:
```typescript
export type FriendRequest = RouterOutputs["friend"]["getPendingRequests"][number];
```
