# AllAtYou Raffle — Technical Spec & Architecture Reference

Documento de referencia rápida para retomar contexto sin explorar todo el código.

---

## 1. Stack y Servicios
- **Framework:** Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS 4).
- **Base de Datos:** Supabase (`@supabase/supabase-js`). Cliente admin con `SUPABASE_SERVICE_ROLE_KEY` en [`app/lib/supabase-admin.ts`](app/lib/supabase-admin.ts).
- **Storage (Imágenes):** Cloudflare R2 vía AWS S3 SDK (`@aws-sdk/client-s3`).
- **Emails:** Resend (`ALLATYOU_RESEND_API_KEY`, `ALLATYOU_RESEND_FROM`, `ALLATYOU_ADMIN_EMAIL`) en [`app/lib/email.ts`](app/lib/email.ts).
- **Autenticación Admin:** Cookie HTTP-only firmada con HMAC-SHA256 (`ADMIN_SECRET`, `ADMIN_COOKIE_NAME`) validada en [`proxy.ts`](proxy.ts) y [`app/lib/admin-auth.ts`](app/lib/admin-auth.ts).

---

## 2. Modelo de Datos (Supabase)
- **`rafle_raffles`**: `id`, `name`, `description`, `price_per_ticket`, `total_tickets`, `start_ticket` (`null` si es modo números específicos), `end_ticket`, `status` (`active` | `paused` | `completed` | `cancelled`), `slug` (único), `is_featured` (bool), `cover_image_url`, `ticket_template_url` (opcional).
- **`rafle_customers`**: `id`, `name`, `phone`, `email`.
- **`rafle_tickets`**: `id`, `raffle_id`, `ticket_number` (text, con padding de ceros), `status` (`available` | `reserved` | `pending` | `paid`), `customer_id`, `payment_proof_url`, `reserved_at`, `admin_notes`.
- **RPCs en Postgres**:
  - `reserve_tickets(p_raffle_id, p_customer_id, p_ticket_numbers)`: reserva atómica evitando colisiones concurrentes.
  - `set_featured_raffle(p_raffle_id)`: marca un sorteo como destacado y desmarca el resto.

---

## 3. Estructura en Cloudflare R2
- `raffle-covers/{raffle_id}.{ext}` → Imagen de portada del sorteo.
- `raffle-templates/{raffle_id}` → Plantilla activa de boleta del sorteo (clave canónica consumida por el generador).
- `raffle-templates/{raffle_id}_{timestamp}.{ext}` → Copia pública con URL única para envío por correo/historial.
- `proofs/{raffle_id}/{first_ticket}_{timestamp}.{ext}` → Comprobantes de pago subidos por compradores.

---

## 4. Mapa de Archivos y Rutas Clave

### Vistas Públicas
- [`app/page.tsx`](app/page.tsx) → Carga sorteos activos y muestra el sorteo destacado (`is_featured`) usando [`app/MainClientPage.tsx`](app/MainClientPage.tsx).
- [`app/sorteos/page.tsx`](app/sorteos/page.tsx) → Catálogo de todos los sorteos activos.
- [`app/sorteos/[slug]/page.tsx`](app/sorteos/[slug]/page.tsx) → Landing individual de un sorteo por `slug` o `id`.
- [`app/verify/page.tsx`](app/verify/page.tsx) → Página a la que apunta el QR de la boleta (`/verify?ticket=XX&raffle=UUID`).

### Componentes de Sorteo y Boleta
- [`app/components/raffle/NumberGrid.tsx`](app/components/raffle/NumberGrid.tsx) → Cuadrícula de números, buscador y filtros.
- [`app/components/raffle/LuckySlot.tsx`](app/components/raffle/LuckySlot.tsx) → Máquina tragamonedas para elegir número al azar.
- [`app/components/raffle/CheckoutModal.tsx`](app/components/raffle/CheckoutModal.tsx) → Flujo de compra en 3 pasos:
  1. Datos del cliente y bloqueo de número (`POST /api/raffles/reserve`).
  2. Datos de pago (Nequi / Bancolombia) y subida de comprobante (`POST /api/raffles/upload-proof`).
  3. Confirmación con **vista previa en vivo** y descarga de cada boleta.
- [`app/components/raffle/TicketDownloadButton.tsx`](app/components/raffle/TicketDownloadButton.tsx) → Generador de boleta en `<canvas>` (`1536 × 2752 px`):
  - Descarga la plantilla del sorteo desde `/api/raffles/[id]/ticket-template` (mismo origen para evitar errores CORS en `canvas.toDataURL`).
  - Estampa nombre del comprador, fecha, número de boleta y código QR de verificación.
  - Soporta **vista previa inline** (`showPreview={true}`, con lightbox de zoom) y **modo compacto con modal** (`variant="small"` en Admin).

### Panel de Administración (`/admin/*`)
- [`app/admin/raffles/page.tsx`](app/admin/raffles/page.tsx) → Listado de sorteos, pausar/reanudar, destacar, agregar números y modal **🎟️ Plantilla Boleta** (con vista previa en vivo `#007 - Juan Pérez` y subida de plantilla).
- [`app/admin/raffles/new/page.tsx`](app/admin/raffles/new/page.tsx) → Crear sorteo (rango o específicos), subir portada y subir plantilla de boleta (aplicar de inmediato o enviar por correo para diseñarla).
- [`app/admin/raffles/[id]/validate/page.tsx`](app/admin/raffles/[id]/validate/page.tsx) → Auditoría de pagos (miniatura + visor modal de comprobante, aprobar/liberar boleta, editar cliente en cascada, ver/descargar boleta).
- [`app/admin/raffles/[id]/edit-tickets/page.tsx`](app/admin/raffles/[id]/edit-tickets/page.tsx) y [`TicketsTable.tsx`](app/components/admin/TicketsTable.tsx) → Edición/eliminación individual o masiva de boletas.

### Endpoints API (`/api/*`)
- `POST /api/raffles/create` → Crea sorteo e inserta boletas en bloque.
- `PATCH | DELETE /api/raffles/[id]` → Edita metadatos/estado o elimina sorteo.
- `POST /api/raffles/upload-cover` → Sube portada a R2.
- `POST /api/raffles/upload-template` → Sube plantilla de boleta a R2 (`is_final_template`) y/o la envía por correo con adjunto al admin (`send_email`).
- `GET /api/raffles/[id]/ticket-template` → Sirve la plantilla del sorteo desde R2 (o fallback a `public/ticket-template.png`); con `?meta=1` devuelve `{ has_custom_template }`.
- `POST /api/raffles/reserve` → Crea cliente y ejecuta RPC `reserve_tickets`.
- `POST /api/raffles/upload-proof` → Sube comprobante a R2, marca ticket y notifica por correo al admin.
- `POST /api/raffles/validate` → Acciones admin: `approve`, `reject` (limpieza profunda), `edit_customer`.

---

## 5. Flujo de Trabajo y Entrega (Definition of Done)
Para cada cambio o requerimiento:
1. Crear/actualizar el spec correspondiente en `docs/specs/NNNN-slug.md` (usando [`docs/specs/TEMPLATE.md`](docs/specs/TEMPLATE.md)) y actualizar [`docs/product.md`](docs/product.md) si cambia el comportamiento del producto.
2. Verificar compilación y calidad (`npm run typecheck`, `npm run lint`, `npm run build`).
3. Hacer `git commit`, `git push`, merge a `main` (o PR merge) y cerrar el issue/ticket correspondiente en GitHub (`Closes #N`).
