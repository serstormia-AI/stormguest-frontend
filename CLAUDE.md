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
- Supabase JS client for all data and auth
- Deployed on Vercel; repo `serstormia-AI/stormguest-frontend` must remain **private**

---

## Data source — supabaseAdmin for everything

All pages use `supabaseAdmin` directly. The Express backend (`services/api.js`) is **fully legacy** — only the login fallback path still calls it. Do not use it for any new features.

Two Supabase clients exported from `src/lib/supabase.js`:

| Export | Key used | Purpose |
|--------|----------|---------|
| `supabase` | `VITE_SUPABASE_ANON_KEY` | Auth (`signInWithPassword`) + Realtime subscriptions + Edge Function invocations |
| `supabaseAdmin` | `VITE_SUPABASE_SERVICE_ROLE_KEY` | All data reads + writes (bypasses RLS) + Auth admin API |

**Always use `supabaseAdmin` for data reads and writes.**

> **Important:** If `VITE_SUPABASE_SERVICE_ROLE_KEY` is missing or invalid, `supabaseAdmin` silently falls back to the anon client and all DB reads return 0 rows (RLS blocks them). This is the most common production bug. The key starts with `sb_secret_` in newer Supabase projects.

---

## Auth — Supabase Auth (primary) + Express fallback

Staff authentication uses Supabase Auth as the primary path. The Express JWT system remains as a fallback for legacy users not yet migrated.

### Login flow (`StormGuestAuth.jsx`)

1. Try `supabase.auth.signInWithPassword({ email, password })`
2. On success → get `role`, `hotel_id`, `name` from `users` table by email
3. On failure (legacy user) → call Express `POST /api/auth/login` (bcrypt verify)
4. On successful Express login → silently call `supabaseAdmin.auth.admin.createUser()` to migrate the user to Supabase Auth (fire and forget)
5. Next login for that user goes through path 1 directly

### localStorage keys set on login

| Key | Value |
|-----|-------|
| `token` | JWT (Supabase session token or Express JWT) |
| `role` | `'reception'` \| `'hotel_manager'` \| `'super_admin'` |
| `hotel_id` | Hotel slug (e.g. `'demo'`) |
| `name` | Display name |
| `email` | Email address (used for test notification emails) |

### User management (SuperAdmin page)

**Create user:**
- Without password → `supabaseAdmin.auth.admin.inviteUserByEmail()` — Supabase sends invite email, user sets own password
- With password → `supabaseAdmin.auth.admin.createUser()` with `email_confirm: true` — works immediately
- Always followed by insert into `users` table with `password_hash: 'supabase_auth'` as sentinel

**Update user:** profile fields (name, role, hotel_id) → `users` table directly. Password change → find auth user via `listUsers` + `updateUserById`.

**Delete user:** remove from `users` table + `supabaseAdmin.auth.admin.deleteUser()` cleanup.

**`users` table note:** rows with `password_hash = 'supabase_auth'` were created via the new flow. Rows with a real bcrypt hash are legacy users (still functional via Express login fallback until migrated).

### Role access

Enforced in `App.jsx` via `ROLE_ROUTES` and `RoleRoute` wrapper:
- **reception**: checkins, chat, requests, orders
- **hotel_manager**: all above + catalog, reviews, notifications, settings, integrations, dashboard
- **super_admin**: all routes + `/admin`

---

## Hotel lookup pattern — always from localStorage

All pages resolve the current hotel from `localStorage.hotel_id` (set at login — this is the hotel **slug**, e.g. `'demo'`). Never hardcode `'demo'`:

```js
const hotelSlug = localStorage.getItem('hotel_id') || 'demo';
const { data: hotel } = await supabaseAdmin
    .from('hotels').select('id').eq('slug', hotelSlug).single();
if (!hotel) { setLoading(false); return; }
const hId = hotel.id; // UUID — use this for all subsequent queries
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
| `users` | `id` (uuid), `name`, `email`, `password_hash`, `role`, `hotel_id` (uuid) | Staff users. `password_hash='supabase_auth'` = new flow user |
| `guests` | `id` (uuid), `hotel_id` (uuid), `auth_user_id`, `name`, `email` | — |
| `reservations` | `id` (uuid), `hotel_id` (uuid), `guest_id` (uuid), `room_number`, `check_in`, `check_out`, `status` | status: `'pending'`\|`'checked_in'`\|`'checked_out'` |
| `conversations` | `id` (uuid), `hotel_id` (**text**), `guest_id` (uuid), `channel`, `status`, `updated_at` | hotel_id is TEXT |
| `messages` | `id` (uuid), `conversation_id` (uuid), `sender` (text), `content`, `created_at` | sender: `'guest'`\|`'staff'`\|`'bot'` — NO hotel_id/guest_id directly |
| `experiences` | `id` (uuid), `hotel_id` (uuid), `title`, `description`, `price` (numeric), `image_url`, `created_at` | NO currency, NO is_active |
| `requests` | `id` (uuid), `hotel_id` (uuid), `guest_id` (uuid), `experience_id` (uuid), `total_price` (numeric), `status`, `created_at` | status: `'pending'`\|`'approved'`\|`'rejected'` |
| `reviews` | `id` (uuid), `hotel_id` (**text**), `guest_id` (uuid), `reservation_id` (uuid), `rating` (integer), `comment`, `created_at` | hotel_id is TEXT; NO responded/response_text |
| `hotel_integrations` | `id` (uuid), `hotel_id` (text), `type`, `provider`, `active`, `config` (jsonb), `last_sync`, `last_error` | type: `'csv'`\|`'ical'`\|`'webhook'`\|`'api'` |
| `integration_sync_logs` | `id` (uuid), `integration_id` (uuid), `hotel_id` (text), `synced_at`, `source`, `action`, `external_id`, `detail` (jsonb) | — |

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
```

---

## Edge Functions

Email sending is handled by the Supabase Edge Function `send-notification` (deployed from `stormguest-backend/supabase/functions/send-notification/`). Uses Resend API.

**Invocation from frontend:**
```js
// Send email to guest
const { data, error } = await supabase.functions.invoke('send-notification', {
    body: { guest_id, subject, message, hotel_id: localStorage.getItem('hotel_id') },
});

// Test email
const { data, error } = await supabase.functions.invoke('send-notification', {
    body: { test: true, to: localStorage.getItem('email') },
});
```

**Required Supabase secrets** (Dashboard → Edge Functions → send-notification → Secrets):
- `RESEND_API_KEY` — from resend.com (free tier: 3000 emails/month)
- `EMAIL_FROM` — sender address, e.g. `StormGuest <notificaciones@tuhotel.com>`

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

## Page inventory

| Page | Route | Data source | Notes |
|------|-------|-------------|-------|
| `Dashboard.jsx` | `/` | `supabaseAdmin` | KPIs: in-house, llegadas pendientes, pedidos pendientes, conversaciones |
| `CheckIns.jsx` | `/checkins` | `supabaseAdmin` | Kanban board |
| `Chat.jsx` | `/chat` | `supabaseAdmin` + Realtime | Conversations → messages |
| `Requests.jsx` | `/requests` | `supabaseAdmin` + Realtime | Pendientes / Historial |
| `Catalog.jsx` | `/catalog` | `supabaseAdmin` | Full CRUD: create modal, edit inline, delete |
| `Reviews.jsx` | `/reviews` | `supabaseAdmin` | Star ratings, distribution stats, create modal |
| `Settings.jsx` | `/settings` | `supabaseAdmin` (branding) + Express (SMTP/Stripe legacy) | Hotel branding saves to `hotels` table |
| `Orders.jsx` | `/orders` | `supabaseAdmin` | Reads `requests` + joins `experiences` + `guests` |
| `Notifications.jsx` | `/notifications` | `supabaseAdmin` (guests list) + Edge Function (send email) | Email via `send-notification` Edge Function |
| `Integrations.jsx` | `/integrations` | `supabaseAdmin` (read/delete) + Express (sync ops) | CSV/iCal/webhook/polling sync ops need backend |
| `SuperAdmin.jsx` | `/admin` | `supabaseAdmin` | Hotels CRUD + users read/delete via supabase; create/update via Auth admin API |
| `StormGuestAuth.jsx` | `/login` | Supabase Auth + Express fallback | Stores token/role/hotel_id/name/email in localStorage |

---

## Settings — hotel branding

`Settings.jsx` has a dedicated section that saves directly to `hotels` table:

```js
await supabaseAdmin.from('hotels').update({
    name, primary_color, primary_color_light, logo_url
}).eq('id', hotelId);
```

---

## Environment variables

```
VITE_SUPABASE_URL              # Supabase project URL
VITE_SUPABASE_ANON_KEY         # Supabase anon/public key
VITE_SUPABASE_SERVICE_ROLE_KEY # Service role key — starts with sb_secret_ in newer projects
VITE_API_URL                   # Express backend URL (legacy — only login fallback + Integrations sync ops)
```

All four must be set in Vercel (Settings → Environment Variables). **After changing env vars, trigger a manual redeploy.**

`VITE_SUPABASE_SERVICE_ROLE_KEY` missing = `supabaseAdmin` falls back to anon = all direct DB reads return 0 rows silently. This is the #1 production issue.

### Supabase Auth — required configuration

In Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: the Vercel production URL (e.g. `https://stormguest.vercel.app`)
- **Redirect URLs**: add the Vercel URL so invite/recovery email links work after confirmation
