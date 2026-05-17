# StormGuest — Frontend

Dashboard de administración para hoteles en la plataforma StormGuest. Permite gestionar check-ins, conversaciones de huéspedes, pedidos, catálogo de servicios, reseñas y notificaciones en tiempo real.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Build | Vite 7 |
| UI | React 19 |
| Estilos | TailwindCSS 4 |
| Iconos | lucide-react |
| Animaciones | Framer Motion |
| Router | React Router DOM 7 |
| HTTP | axios |
| Realtime | Supabase JS v2 (Realtime subscriptions) |

---

## Variables de entorno

Copiá `.env.example` como `.env` y completá los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (sin trailing slash) |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key de Supabase (segura en el browser) |

Las variables deben tener el prefijo `VITE_` para que Vite las exponga al bundle. No uses aquí la `service_role_key`.

---

## Correr en local

```bash
npm install
cp .env.example .env
# Editá .env con tus valores
npm run dev
```

La app levanta en `http://localhost:5173`.

---

## Build de producción

```bash
npm run build
```

Genera los archivos estáticos en `dist/`. Se puede servir con cualquier CDN o plataforma de hosting estático.

---

## Páginas disponibles

| Ruta | Componente | Descripción |
|---|---|---|
| `/login` | `StormGuestAuth.jsx` | Login con email + password |
| `/dashboard` | `Dashboard.jsx` | KPIs del hotel: huéspedes, reservas activas, mensajes del día |
| `/checkins` | `CheckIns.jsx` | Gestión de check-ins y check-outs |
| `/chat` | `Chat.jsx` | Conversaciones de WhatsApp con huéspedes en tiempo real |
| `/requests` | `Requests.jsx` | Pedidos y solicitudes de huéspedes |
| `/catalog` | `Catalog.jsx` | Catálogo de servicios del hotel (con subida de imágenes) |
| `/reviews` | `Reviews.jsx` | Reseñas de huéspedes |
| `/orders` | `Orders.jsx` | Órdenes y pagos (integración Stripe) |
| `/notifications` | `Notifications.jsx` | Envío manual de emails a huéspedes |
| `/panel` | `StormGuestHotelPanel.jsx` | Configuración del hotel (admin) |

---

## Deploy en Vercel

1. Crear nuevo proyecto en [vercel.com](https://vercel.com)
2. Conectar el repositorio de GitHub
3. Framework preset: **Vite** (Vercel lo detecta automáticamente)
4. Agregar las variables de entorno en **Settings → Environment Variables**:
   - `VITE_API_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Cada push a la rama principal dispara un redeploy automático.

Para SPAs con React Router, Vercel maneja las rutas correctamente sin configuración adicional.
