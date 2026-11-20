# Bata Blanca · Libro de recuerdos · Medicina · Universidad de Sucre

Libro de recuerdos digital para la Ceremonia de Entrega de Batas (5 de diciembre de 2026).
Stack: Next.js 15 (App Router) + TypeScript, Tailwind, Neon (Postgres) con Drizzle, ImageKit para fotos, Cloudinary para videos y notas de voz, despliegue en Vercel.

El brief completo está en `prompt-libro-recuerdos-medicina.md`.

## Estado

- [x] **Fase 1 · Base:** proyecto, tema, esquema, acceso del admin, auditoría, sitio privado.
- [x] **Fase 2 · Promoción y subida:** lista de estudiantes, fotos en ImageKit, videos y notas de voz en Cloudinary, moderación, ajustes.
- [x] **Fase 3 · Galería y mosaico:** galería con filtros, visor y reacciones; mosaico en cuadrícula y masonry; fotomosaico (necesita que ImageKit permita leer las fotos desde tu sitio, CORS).
- [~] **Fase 4 · Secciones emotivas:** intro del libro (una vez por navegador), cuenta regresiva, "Firma la bata", muro de recetas, línea de tiempo y juramento. **Pendiente:** animaciones finas (ECG que late, cursor, skeletons).
- [~] **Fase 5 · Panel y personalización:** temas, edición en línea del título y subtítulo, contenido de portada, juramento, línea y premios desde el panel. **Pendiente:** reordenar y ocultar secciones, vista previa móvil/escritorio, editar más textos en línea.
- [x] **Fase 6 · Extras:** cápsula del tiempo (se abre en la fecha), premios con votación, profesores, libro de visitas con moderación, libro para imprimir o guardar como PDF y playlist. **Nota:** el PDF se genera con "Imprimir → Guardar como PDF" del navegador.
- [x] **Fase 7 · Modo ceremonia:** `/en-vivo` con fotos y videos nuevos, QR para subir y llamado a lista desde `/admin/ceremonia`.
- [~] **Fase 8 · Pulido:** pendiente de pruebas en celular y ajustes finos de animación.

## Protección del contenido

Pensado para que nadie pueda borrar ni llenar el sitio de contenido indebido:

- **Moderación activa por defecto:** cada recuerdo nuevo queda `pending` hasta que el admin lo apruebe.
- **Nada se borra solo ni por un estudiante.** Ocultar (`hidden`) es la acción normal. Eliminar definitivamente es una acción explícita del admin y queda en el registro.
- **Registro de auditoría** (`audit_log`): inicios de sesión, intentos fallidos, bloqueos y, en fases siguientes, cada aprobación, ocultación o eliminación.
- **Límite de intentos** al ingresar al panel: 5 intentos cada 15 minutos por IP.
- **Sesión del admin** en cookie `HttpOnly`, `SameSite=Lax`, válida 12 horas, firmada con `AUTH_SECRET`.
- **Sitio privado:** `noindex` en metadatos y cabecera `X-Robots-Tag`.
- **Exportación de respaldo** (fase 5): ZIP con fotos y JSON, para no depender de un solo servicio.

## Puesta en marcha (local)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env.local` (o usa `.env`) y completa los valores (Neon, ImageKit, Cloudinary, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
   - `AUTH_SECRET`: `openssl rand -base64 48`
   - `CRON_SECRET`: `openssl rand -hex 32`
3. Crea las tablas en Neon:
   ```bash
   npm run db:migrate
   ```
4. Crea la cuenta del administrador (lee `ADMIN_EMAIL` y `ADMIN_PASSWORD` de `.env.local`):
   ```bash
   npm run admin:create
   ```
   Después **borra `ADMIN_PASSWORD` del archivo de entorno**. La contraseña queda guardada como hash bcrypt.
5. Arranca el sitio:
   ```bash
   npm run dev
   ```
   - Portada: http://localhost:3000
   - Panel: http://localhost:3000/admin

## Configuración de servicios

### ImageKit (fotos)
1. Crea la cuenta en el plan **Forever Free** (sin tarjeta).
2. Copia la clave pública (`NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`), la clave privada (`IMAGEKIT_PRIVATE_KEY`, solo servidor) y el URL endpoint (`NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`).
3. Los límites del plan gratuito se verifican en el panel de ImageKit antes de la ceremonia.

### Cloudinary (videos y notas de voz)
Guarda `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. Solo se usan firmas del servidor; no se configuran presets sin firma.

### Vercel (despliegue)
1. Importa el repositorio y, desde el Marketplace, instala Neon (crea `DATABASE_URL` solo).
2. Copia el resto de variables de `.env.example` en *Project → Settings → Environment Variables*.
3. `IMAGEKIT_PRIVATE_KEY`, `CLOUDINARY_API_SECRET`, `DATABASE_URL`, `AUTH_SECRET` y `CRON_SECRET` nunca llevan prefijo `NEXT_PUBLIC_`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run db:generate` | Genera una migración desde `src/db/schema.ts` |
| `npm run db:migrate` | Aplica migraciones a Neon |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run admin:create` | Crea o actualiza la cuenta del administrador |
