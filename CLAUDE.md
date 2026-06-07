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
- Supabase JS client (`supabaseAdmin`) for all data — direct DB access bypassing RLS
- Deployed on Vercel; repo `serstormia-AI/stormguest-frontend` must remain **private**

---

## Data source — Supabase direct (supabaseAdmin) for everything

All pages use `supabaseAdmin` directly. The Express backend (`services/api.js`) is legacy and 401s in production — **do not use it for new features**.

Two Supabase clients exported from `src/lib/supabase.js`:

| Export | Key used | Purpose |
|--------|----------|---------|
| `supabase` | `VITE_SUPABASE_ANON_KEY` | Realtime subscriptions only |
| `supabaseAdmin` | `VITE_SUPABASE_SERVICE_ROLE_KEY` | All data reads + writes (bypasses RLS) |

**Always use `supabaseAdmin` for data reads and writes.** Use `supabase` (anon) for Realtime `.channel().on().subscribe()` only — **but prefer `supabaseAdmin` for Realtime too** since the anon key may be blocked by RLS.

> **Important:** If `VITE_SUPABASE_SERVICE_ROLE_KEY` is missing or invalid, `supabaseAdmin` silently falls back to the anon client and all DB reads return 0 rows (RLS blocks them). This is the most common production bug. The key starts with `sb_secret_` in newer Supabase projects.

---

## Hotel lookup pattern — always from localStorage

All pages resolve the current hotel from `localStorage.hotel_id` (set at login). Never hardcode `'demo'`:

```js
const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
const { data: hotel } = await supabaseAdmin
    .from('hotels').select('id').eq('slug', hotelSlug).single();
if (!hotel) { setLoading(false); return; }
const hId = hotel.id; // UUID
```

---

## No FK constraints — always two-step fetches

```js
// 1. Fetch primary table
const { data: reservations } = await supabaseAdmin
    .from('reservations').select('id, room_number, status, guest_id').eq('hotel_id', hId);

// 2. Collect IDs, fetch related table
const guestIds = [...new Set(reservations.map(r => r.guest_id).filter(Boolean))];
const { data: guests } = await supabaseAdmin
    .from('guests').select('id, name').in('id', guestIds);

// 3. Merge in JS
const guestsMap = Object.fromEntries(guests.map(g => [g.id, g]));
const merged = reservations.map(r => ({ ...r, guest: guestsMap[r.guest_id] ?? null }));
```

---

## Database schema (verified — do not guess column names)

| Table | Columns | Notes |
|-------|---------|-------|
| `hotels` | `id` (uuid), `slug`, `name`, `primary_color`, `primary_color_light`, `logo_url` | — |
| `guests` | `id` (uuid), `hotel_id` (uuid), `auth_user_id`, `name`, `email` | — |
| `reservations` | `id` (uuid), `hotel_id` (uuid), `guest_id` (uuid), `room_number`, `check_in`, `check_out`, `status` | status: `'pending'`\|`'checked_in'`\|`'checked_out'` |
| `conversations` | `id` (uuid), `hotel_id` (**text**), `guest_id` (uuid), `channel`, `status`, `updated_at` | hotel_id is TEXT |
| `messages` | `id` (uuid), `conversation_id` (uuid), `sender` (text), `content`, `created_at` | sender: `'guest'`\|`'staff'`\|`'bot'` — NO hotel_id/guest_id directly |
| `experiences` | `id` (uuid), `hotel_id` (uuid), `title`, `description`, `price` (numeric), `image_url`, `created_at` | NO currency, NO is_active |
| `requests` | `id` (uuid), `hotel_id` (uuid), `guest_id` (uuid), `experience_id` (uuid), `total_price` (numeric), `status`, `created_at` | status: `'pending'`\|`'approved'`\|`'rejected'` — NO internal_note |
| `reviews` | `id` (uuid), `hotel_id` (**text**), `guest_id` (uuid), `reservation_id` (uuid), `rating` (integer), `comment`, `created_at` | hotel_id is TEXT; NO responded/response_text |

**Critical:** `messages` does NOT have `hotel_id`, `guest_id`, or `sender_type`. Messages link to guests through `conversations`.

---

## Chat architecture — conversations → messages

```js
// Get guests who have conversations with this hotel
const { data: conversations } = await supabaseAdmin
    .from('conversations').select('id, guest_id')
    .eq('hotel_id', hId)          // hId is UUID, hotel_id is TEXT — comparison works
    .order('updated_at', { ascending: false });

// Get messages for a specific conversation
const { data: messages } = await supabaseAdmin
    .from('messages').select('id, sender, content, created_at')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true });

// Insert staff reply
await supabaseAdmin.from('messages').insert({
    conversation_id: convId,
    sender: 'staff',
    content: msgText,
});

// Realtime on conversation_id
const channel = supabaseAdmin.channel(`admin-chat-${convId}`)
    .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`
    }, handler).subscribe();
```

---

## Auth and RBAC

Auth uses JWT from the Express backend stored in localStorage:
- `localStorage.token` — JWT for any remaining Express API calls
- `localStorage.role` — `'reception'` | `'hotel_manager'` | `'super_admin'`
- `localStorage.name` — display name
- `localStorage.hotel_id` — hotel slug (e.g. `'demo'`), used for Supabase hotel lookup

Role access is enforced in `App.jsx` via `ROLE_ROUTES` and `RoleRoute` wrapper:
- **reception**: checkins, chat, requests, orders
- **hotel_manager**: all above + catalog, reviews, notifications, settings, integrations, dashboard
- **super_admin**: all routes + `/admin`

---

## Page inventory

| Page | Route | Data source | Notes |
|------|-------|-------------|-------|
| `Dashboard.jsx` | `/` | `supabaseAdmin` | KPIs: in-house, llegadas pendientes, pedidos pendientes, conversaciones. Reservas + pedidos con nombres |
| `CheckIns.jsx` | `/checkins` | `supabaseAdmin` | Kanban board; `updateStatus` uses `supabaseAdmin` |
| `Chat.jsx` | `/chat` | `supabaseAdmin` + Realtime | Conversations → messages; Realtime on `conversation_id` |
| `Requests.jsx` | `/requests` | `supabaseAdmin` + Realtime | Pendientes / Historial; Realtime on `hotel_id` |
| `Catalog.jsx` | `/catalog` | `supabaseAdmin` | Full CRUD: create modal, edit inline, delete with confirm |
| `Reviews.jsx` | `/reviews` | `supabaseAdmin` | Star ratings, distribution stats, create modal; NO responded/response_text columns |
| `Settings.jsx` | `/settings` | `supabaseAdmin` (branding) + Express (SMTP/Stripe) | Hotel branding (name, colors, logo) saves to `hotels` table |
| `Orders.jsx` | `/orders` | Express API | Payment history — backend dependent |
| `Notifications.jsx` | `/notifications` | Express API | — |
| `Integrations.jsx` | `/integrations` | Express API | — |
| `SuperAdmin.jsx` | `/admin` | Express API | — |
| `StormGuestAuth.jsx` | `/login` | Express API (`loginUser`) | Sets localStorage on success |

---

## Realtime pattern

Use `supabaseAdmin` for Realtime subscriptions (not anon `supabase`) to avoid RLS blocking events:

```js
const channel = supabaseAdmin
    .channel('hotel-requests')
    .on('postgres_changes', {
        event: '*', schema: 'public', table: 'requests',
        filter: `hotel_id=eq.${hotelId}`
    }, () => fetchRequests(hotelId))
    .subscribe();

return () => { supabaseAdmin.removeChannel(channel); };
```

---

## Settings — hotel branding

`Settings.jsx` has a dedicated section that saves directly to `hotels` table:

```js
await supabaseAdmin.from('hotels').update({
    name, primary_color, primary_color_light, logo_url
}).eq('id', hotelId);
```

Changes to `primary_color`/`primary_color_light` are reflected in the guest app on next page load (layout fetches from DB).

---

## Environment variables

```
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_ANON_KEY         # Supabase anon/public key
VITE_SUPABASE_SERVICE_ROLE_KEY # Service role key — starts with sb_secret_ in newer projects
VITE_API_URL                   # Express backend URL (legacy, only Orders/Notifications/Integrations/SuperAdmin)
```

All four must be set in Vercel (Settings → Environment Variables). **After changing env vars, trigger a manual redeploy** — Vercel does not automatically rebuild when only env vars change.

`VITE_SUPABASE_SERVICE_ROLE_KEY` missing = `supabaseAdmin` falls back to anon = all direct DB reads return 0 rows silently. This is the #1 production issue.
