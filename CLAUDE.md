# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start local dev server (http://localhost:5173)
npm run build      # Vite production build
npm run preview    # Preview the production build locally
```

No test suite exists. Validate changes manually via `npm run build` and the dev server.

## Architecture

**stormguest-frontend** is the hotel staff admin dashboard — a Vite + React SPA. It is **not** the guest-facing app (that's `stormguest-app`, a separate Next.js repo). Staff access this at the deployed Vercel URL.

### Stack
- Vite 6 + React 19 (JSX, not TypeScript)
- React Router v7 for SPA routing
- TailwindCSS for styling (dark theme, zinc palette, emerald accent)
- Lucide-react for icons
- Axios (`services/api.js`) for Express backend calls
- Supabase JS client for direct DB access (Chat, CheckIns, Requests pages) and Realtime
- Deployed on Vercel; repo `serstormia-AI/stormguest-frontend` must remain **private**

---

## Two data sources — critical to understand which page uses which

There are two completely separate ways pages fetch data. **Do not mix them.**

### 1. Express backend API (`src/services/api.js`)
Used by: **Dashboard, Orders, Reviews, Settings, Integrations, SuperAdmin**

An Axios instance hitting `VITE_API_URL` (defaults to `http://localhost:3001/api`). Auth via JWT in `localStorage.token` injected as `Authorization: Bearer` header.

```js
import { getReservations, getGuests, getAnalytics } from '../services/api';
const { data } = await getAnalytics(hotel_id);
```

The `hotel_id` for these calls comes from `localStorage.getItem('hotel_id')` (set at login by the Express auth response).

### 2. Supabase direct (`src/lib/supabase.js`)
Used by: **Chat, CheckIns, Requests**

Two Supabase clients are exported:

| Export | Key used | Purpose |
|--------|----------|---------|
| `supabase` | `VITE_SUPABASE_ANON_KEY` | Realtime subscriptions only |
| `supabaseAdmin` | `VITE_SUPABASE_SERVICE_ROLE_KEY` | All data reads + writes (bypasses RLS) |

**Always use `supabaseAdmin` for data reads and writes.** Use `supabase` (anon) only for Realtime `.channel().on().subscribe()`.

> **Security note:** `VITE_` prefix causes Vite to bundle env vars into the JS build, making `VITE_SUPABASE_SERVICE_ROLE_KEY` visible in the browser bundle. This is acceptable for an internal MVP admin tool, but the deployed URL must not be shared publicly.

---

## RLS bypass — why `supabaseAdmin` is mandatory

Supabase RLS policies scope tables to `hotel_id` via `current_setting('app.hotel_id')`. That setting is never populated in the browser context, so any query using the anon key returns 0 rows. The service role key bypasses RLS entirely.

```js
// Wrong — returns 0 rows (RLS blocks it)
const { data } = await supabase.from('guests').select('*');

// Correct — bypasses RLS
const { data } = await supabaseAdmin.from('guests').select('*');
```

---

## No FK constraints — always use two-step fetches

The database has no foreign key constraints. PostgREST join syntax (`!inner`, nested selects) silently returns empty results without FKs. Pattern for all joined data:

```js
// 1. Fetch primary table
const { data: reservations } = await supabaseAdmin
    .from('reservations').select('id, room_number, check_in, check_out, status, guest_id')
    .eq('hotel_id', hotelId);

// 2. Collect IDs, fetch related table
const guestIds = [...new Set(reservations.map(r => r.guest_id).filter(Boolean))];
const { data: guests } = await supabaseAdmin
    .from('guests').select('id, name, email').in('id', guestIds);

// 3. Merge in JS
const guestsMap = Object.fromEntries(guests.map(g => [g.id, g]));
const merged = reservations.map(r => ({ ...r, guest: guestsMap[r.guest_id] ?? null }));
```

---

## Database column names (critical — do not guess)

| Table | Correct columns | Wrong (do not use) |
|-------|----------------|--------------------|
| `guests` | `name`, `email`, `hotel_id`, `auth_user_id` | `first_name`, `last_name` |
| `reservations` | `room_number`, `check_in`, `check_out`, `status`, `guest_id`, `hotel_id` | `checkin_date`, `checkout_date` |
| `messages` | `hotel_id`, `guest_id`, `sender_type`, `content`, `created_at` | — |
| `experiences` | `id`, `hotel_id`, `title`, `description`, `price`, `currency`, `image_url`, `is_active` | — |
| `requests` | `hotel_id`, `guest_id`, `experience_id`, `total_price`, `status`, `internal_note` | — |

`sender_type` values: `'guest'` | `'staff'` | `'bot'`

---

## Auth and RBAC

Auth uses JWT from the Express backend stored in localStorage:
- `localStorage.token` — JWT for API calls
- `localStorage.role` — `'reception'` | `'hotel_manager'` | `'super_admin'`
- `localStorage.name` — display name
- `localStorage.hotel_id` — UUID for Express API calls
- `localStorage.hotel_slug` — slug for display / webhook URLs

Role access is enforced in `App.jsx` via `ROLE_ROUTES` and `RoleRoute` wrapper:
- **reception**: checkins, chat, requests, orders
- **hotel_manager**: all of the above + catalog, reviews, notifications, settings, integrations, dashboard
- **super_admin**: all routes + `/admin`

Pages redirect to `/login` (via `PrivateRoute`) if `localStorage.token` is absent.

---

## Page inventory and data source

| Page | Route | Data source | Notes |
|------|-------|-------------|-------|
| `Dashboard.jsx` | `/` | Express API (`getAnalytics`, `getReservations`, `getGuests`) | Reads `hotel_id` from localStorage |
| `CheckIns.jsx` | `/checkins` | `supabaseAdmin` | Kanban board; hardcoded slug `'demo'` for hotel lookup — **known limitation** |
| `Chat.jsx` | `/chat` | `supabaseAdmin` + Realtime | Hardcoded slug `'demo'`; shows only guests with messages |
| `Requests.jsx` | `/requests` | `supabaseAdmin` + Realtime | Two-step fetch for guests and experiences |
| `Catalog.jsx` | `/catalog` | Express API | Experiences/upsells management |
| `Reviews.jsx` | `/reviews` | Express API (`getReviews`, `createReview`, `deleteReview`, `updateReview`) | Star ratings with inline reply form |
| `Orders.jsx` | `/orders` | Express API (`getOrders`) | Payment history |
| `Notifications.jsx` | `/notifications` | Express API | — |
| `Settings.jsx` | `/settings` | Express API (`getSettings`, `updateSettings`, `testNotification`) | Julia prompt, SMTP, Stripe config |
| `Integrations.jsx` | `/integrations` | Express API | CSV import, iCal sync, webhooks, API polling for Cloudbeds/Apaleo |
| `SuperAdmin.jsx` | `/admin` | Express API | Hotels and users CRUD |
| `StormGuestAuth.jsx` | `/login` | Express API (`loginUser`) | Sets localStorage on success |

---

## Known bugs / limitations

1. **`CheckIns.jsx` — `updateStatus` uses anon client**: The `updateStatus` function calls `supabase.from('reservations').update(...)` (anon key). This will fail silently due to RLS. Should be changed to `supabaseAdmin`.

2. **Hotel hardcoded to `'demo'` slug in Chat and CheckIns**: Both pages do `.eq('slug', 'demo')` instead of reading the hotel from auth context. Acceptable for single-hotel MVP; must be fixed for multi-tenant.

3. **`VITE_SUPABASE_SERVICE_ROLE_KEY` exposed in JS bundle**: Vite bundles all `VITE_` vars into the client build. The service role key is visible in DevTools on the deployed URL. Acceptable for internal-only tool.

---

## Realtime subscriptions

Pages that use Realtime always use the anon `supabase` client (not `supabaseAdmin`):

```js
const channel = supabase
    .channel(`admin-chat-${guestId}`)
    .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `guest_id=eq.${guestId}`
    }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
    })
    .subscribe();

return () => { supabase.removeChannel(channel); };
```

Cleanup is always in the `useEffect` return. Realtime requires the `messages_guest_select` RLS policy to be active on the Supabase project for guest-scoped subscriptions to work.

---

## Environment variables

```
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_ANON_KEY         # Supabase anon/public key
VITE_SUPABASE_SERVICE_ROLE_KEY # Service role key — bundled into JS build (internal tool only)
VITE_API_URL                   # Express backend URL (e.g. https://api.serstormia.cloud/api)
```

All four must be set in Vercel project settings (Settings → Environment Variables → Add) for production to work. The `VITE_SUPABASE_SERVICE_ROLE_KEY` is the one most often missing — without it, `supabaseAdmin` falls back to the anon client and all direct DB reads return 0 rows.
