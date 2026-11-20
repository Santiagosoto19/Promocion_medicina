# PROMPT — "Bata Blanca": Libro de Recuerdos Digital · Medicina · Universidad de Sucre

> **Actualización de decisiones (vigente):** las **fotos** se guardan en **ImageKit (plan Forever Free)**, no en Cloudflare R2. Los **videos** y notas de voz siguen en **Cloudinary**. Neon solo guarda metadatos. Donde el texto diga R2, léase ImageKit según la sección 13. **Sin código de acceso:** cualquiera puede subir con su nombre de la lista; el filtro es la moderación del admin (aprobar antes de publicar).

> Copia todo este documento y pégalo como prompt inicial en tu herramienta de IA (Cursor, Claude Code, v0, Bolt, etc.). Está pensado para construirse por fases. Pide al agente que confirme el plan antes de escribir código.

---

## 0. Rol y objetivo

Actúa como un **desarrollador full-stack senior y diseñador de producto** especializado en experiencias web emotivas, animaciones de alto nivel y sistemas de contenido colaborativo.

Vas a construir **"Bata Blanca"** (nombre editable desde el panel), un **libro de recuerdos digital interactivo** para los estudiantes de **Medicina de la Universidad de Sucre (Sincelejo, Colombia)**, con motivo de su **Ceremonia de Entrega de Batas el 5 de diciembre de 2026**.

La web debe sentirse como **abrir un libro de recuerdos precioso**: elegante, limpio, cálido y lleno de detalles animados que emocionen. Los estudiantes suben sus propias fotos, videos y mensajes; cada recuerdo muestra claramente **quién lo subió**. Existe **una sola cuenta de administrador** que puede personalizar absolutamente todo desde la propia página, sin tocar código.

**Idioma de toda la interfaz:** español (Colombia).

> ⭐ **PRIORIDAD MÁXIMA: la experiencia visual.** Esto no es un CRUD con fotos. Es un regalo emocional. Cada pantalla debe hacer que un estudiante, su mamá o un profesor diga *"¡wow!"* y quiera compartirla. Si hay que elegir entre una función más o una animación mejor pulida, se elige la animación pulida. La sección **14 (Dirección de arte y animaciones)** es obligatoria y tiene el mismo peso que la arquitectura técnica.

---

## 1. Stack técnico

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Estilos:** Tailwind CSS + variables CSS para el tema (para que el admin cambie colores en vivo)
- **Animaciones:**
  - `framer-motion` (motion) → transiciones de página, layout animations, modales, hover, aparición de tarjetas
  - `gsap` + `ScrollTrigger` → animaciones ligadas al scroll (línea de tiempo, efecto de pasar páginas, línea de electrocardiograma que se dibuja)
  - `lenis` → scroll suave
  - `canvas-confetti` → celebraciones (al subir un recuerdo, al llegar el día de la ceremonia)
  - Opcional: `lottie-react` para micro-ilustraciones (estetoscopio, corazón latiendo)
- **Base de datos:** **Neon** (Postgres serverless), conectada con `@neondatabase/serverless` + **Drizzle ORM** (`drizzle-orm` + `drizzle-kit` para migraciones). Instalar desde el Marketplace de Vercel para que las variables de entorno se configuren solas
- **Auth del admin:** Auth.js (NextAuth v5) con proveedor de credenciales, o sesión propia con cookie firmada (`jose`). Contraseña con hash `bcrypt`/`argon2`
- **Fotos:** **ImageKit** (plan Forever Free, sin tarjeta). Subida directa desde el navegador con autorización firmada en el servidor (`getUploadAuthParams` de `@imagekit/next`). Se sube **una sola versión comprimida** (máx. 2048 px, menos de 500 KB) y los tamaños de visualización salen de transformaciones con nombre (`thumb` 400 px, `gallery` 1080 px, `lightbox` 1920 px). Nunca se sirve el original en el mosaico ni en la galería (ver sección 13)
- **Videos y notas de voz:** **Cloudinary**, solo para esto. Subida directa firmada y por partes (chunked). Cloudinary convierte los formatos del celular (HEVC/.mov → MP4) y genera los pósters
- Neon solo guarda texto y metadatos, nunca archivos
- **Tiempo real (modo ceremonia):** sondeo ligero con SWR cada 4–5 s contra un endpoint cacheado. Opcional: Pusher Channels o Ably (plan gratuito) para tiempo real verdadero
- **Mensajes:** texto en Postgres (Server Action normal, porque pesan muy poco)
- **Hosting:** Vercel (plan Hobby)
- **Conversión de fotos de iPhone:** `heic2any` (HEIC → JPEG antes de comprimir)
- **Galería:** `react-photo-album` (masonry / rows / columns) + `yet-another-react-lightbox` (con plugins de video, zoom, captions, slideshow)
- **Subida de archivos:** `react-dropzone` + compresión de imágenes en el cliente con `browser-image-compression` (máx. ~2000px, WebP)
- **Validación:** `zod` + `react-hook-form`
- **Editor de texto enriquecido para mensajes:** `tiptap` (negritas, cursivas, emojis), con límite de caracteres
- **Generación de PDF del libro:** `@react-pdf/renderer` o exportación con Puppeteer en una ruta de servidor
- **QR:** `qrcode.react`
- **Deploy:** Vercel

---

## 2. Identidad visual

### Principios
- **Fondo blanco** como base obligatoria (`#FFFFFF`), con mucho aire, sensación de bata limpia y papel fino.
- Elegante, emotivo, nada recargado. Las animaciones deben ser **espectaculares pero suaves**, nunca mareantes.
- Respetar `prefers-reduced-motion`: si el usuario lo tiene activo, reducir animaciones a fundidos simples.

### Paleta por defecto (editable desde el panel)
| Rol | Color | Uso |
|---|---|---|
| Fondo | `#FFFFFF` | Base |
| Superficie | `#F7FAFC` | Tarjetas, secciones alternas |
| Primario | `#0E7C86` (verde azulado clínico) | Botones, enlaces, acentos |
| Secundario | `#1E3A8A` (azul profundo) | Títulos, encabezados |
| Acento dorado | `#C9A227` | Detalles de ceremonia, bordes de honor, sellos |
| Acento cálido | `#F4A7B9` (rosa suave) | Corazones, reacciones, detalles emotivos |
| Texto | `#1F2937` | Cuerpo |
| Texto suave | `#6B7280` | Metadatos, fechas |

> Si la universidad tiene colores institucionales oficiales, el admin puede cargarlos desde el panel ("Tema → Colores institucionales").

### Tipografía (Google Fonts, editable desde el panel)
- **Títulos:** `Fraunces` o `Playfair Display` (serif elegante, tipo libro)
- **Cuerpo:** `Manrope` o `Inter`
- **Mensajes manuscritos / dedicatorias:** `Caveat` o `Dancing Script` (parece escrito a mano en el libro)
- **Datos/fechas/números:** `JetBrains Mono` pequeño, estilo historia clínica

### Motivos gráficos médicos (sutiles, en línea fina SVG)
- Línea de **electrocardiograma (ECG)** como separador entre secciones, que se **dibuja al hacer scroll** (animación `stroke-dashoffset`).
- Iconos de línea: estetoscopio, corazón anatómico, caduceo / vara de Esculapio, bata, microscopio, libro.
- Textura muy sutil de papel en las "páginas" del libro.
- Sellos dorados tipo lacre para destacar recuerdos importantes.

---

## 3. Roles y acceso

### Administrador (una sola cuenta)
- Login con email + contraseña (Auth.js / sesión propia; credenciales en variables de entorno o en la tabla `admins` de Neon). Ruta: `/admin`. Protegida con `middleware.ts`.
- Puede editar TODO el contenido y la apariencia desde un **modo edición en la propia página** (ver sección 6).
- Modera, destaca, oculta o elimina cualquier recuerdo.

### Estudiantes (sin cuenta, acceso simple)
Para que sea fácil y no tengan que registrarse:
1. El admin crea la **lista de la promoción** (nombre, apodo, foto de perfil opcional, frase).
2. El admin genera un **código de acceso de la promoción** (ej. `BATA2026`) y/o un **enlace mágico + QR**.
3. Al subir algo, el estudiante ingresa el código una vez y **elige su nombre de la lista** (con buscador y su foto). Se guarda en `localStorage` para que no lo pida otra vez en ese dispositivo.
4. Opcional (activable en el panel): enlace personal único por estudiante (`/u/[token]`) para evitar que alguien suba algo en nombre de otro.

### Familias e invitados (opcional, activable)
- Pueden dejar mensajes en el **"Libro de visitas de la ceremonia"** con su nombre y parentesco (ej. "Mamá de Laura"), siempre pasando por moderación.

### Moderación
- Interruptor en el panel: **publicación inmediata** o **requiere aprobación**.
- Cola de moderación con vista previa, aprobar/rechazar en lote.

---

## 4. Atribución: que siempre se sepa quién subió cada cosa

Cada recuerdo muestra:
- **Avatar circular** del estudiante (o iniciales con color generado a partir del nombre).
- **Nombre + apodo** (ej. "Laura Martínez · *La Doctora Café*").
- Fecha y semestre/momento asociado (ej. "Semestre 4 · Práctica de Anatomía").
- Al pasar el cursor o tocar el avatar → **mini tarjeta de perfil** animada con su frase y botón "Ver todos sus recuerdos".
- Página de perfil por estudiante: `/promocion/[slug]` con todos sus aportes, su frase, su "receta para el futuro" y los mensajes que otros le dejaron.

---

## 5. Secciones del sitio (todas activables/desactivables y reordenables por el admin)

### 5.1 Intro / Portada "Abrir el libro"
- Pantalla inicial blanca con una **bata blanca en SVG** que se dibuja trazo a trazo.
- Luego aparece un **libro cerrado** con el título en dorado ("Promoción Medicina · Universidad de Sucre · 2026"). Al hacer clic o scroll, **la portada se abre en 3D** (`rotateY` con perspectiva) y revela el sitio.
- Botón "Saltar intro" y recordar que ya se vio.

### 5.2 Hero
- Título grande con animación de letras (aparición escalonada palabra por palabra).
- Foto grupal de fondo (editable) con efecto parallax suave y degradado a blanco.
- **Cuenta regresiva** animada hasta el **5 de diciembre de 2026** (hora editable). El día de la ceremonia cambia a "¡Hoy es el día! 🩺" con confeti.
- Línea de ECG que late al ritmo de un corazón (≈70 bpm) bajo el título.

### 5.3 Mosaico de la promoción
- **Mosaico de fotos** de todos los estudiantes. Modos seleccionables desde el panel:
  - **Masonry** (tipo Pinterest)
  - **Cuadrícula perfecta**
  - **Fotomosaico**: muchas fotos pequeñas que, vistas de lejos, forman una imagen grande (una bata, un corazón, el escudo o la foto grupal). Al hacer zoom se ven las fotos individuales.
  - **Forma personalizada**: las fotos se acomodan dentro de una silueta (corazón, estetoscopio, número "2026").
- Aparición de las fotos en cascada al entrar en pantalla. Hover: la foto se eleva, se colorea (si el resto está en blanco y negro) y muestra el nombre.

### 5.4 Línea de tiempo "Historia clínica de la promoción"
- Diseñada como una **historia clínica / expediente**: cada semestre es un "registro de evolución".
- Scroll vertical con la línea de ECG dibujándose y los hitos apareciendo a los lados (alternados).
- Hitos editables: primer día, primera clase de anatomía, primer parcial difícil, prácticas, eventos, la ceremonia.
- Cada hito puede tener fotos/videos vinculados de los estudiantes.

### 5.5 Galería de recuerdos (fotos y videos)
- Filtros animados: por estudiante, por semestre, por categoría (Clases, Prácticas, Rumbas, Viajes, Estudio en grupo, Momentos graciosos, Ceremonia), por tipo (foto/video).
- Lightbox a pantalla completa con swipe en móvil, zoom, video, pie de foto y autor.
- **Reacciones** (❤️ 🩺 😂 🥹 👏) con animación de partículas al reaccionar.
- Comentarios cortos opcionales (moderables).

### 5.6 Mensajes y dedicatorias — "Muro de recetas"
- Cada mensaje se ve como una **receta médica** o **nota adhesiva** con letra manuscrita, ligeramente rotada, con sombra suave.
- Tipos de mensaje: para la promoción, para un compañero específico, para un profesor, para la familia, para "mi yo del futuro".
- Al aparecer, las notas "caen" y se acomodan con física suave (spring).

### 5.7 "Firma la bata" ✍️ (sección estrella)
- Una **bata blanca grande en SVG** en el centro.
- Cada estudiante puede **firmar con el dedo o el mouse** (canvas de firma) y dejar una frase corta. Las firmas se acomodan sobre la bata como en las tradiciones de graduación.
- Al pasar sobre una firma → muestra el nombre y su frase.
- Se puede descargar la bata firmada en alta resolución (PNG/PDF) para imprimir.

### 5.8 Cápsula del tiempo ⏳
- Los estudiantes escriben una carta para su **yo del futuro** (o graban un video).
- Queda **sellada con animación de lacre dorado** y no se puede leer hasta la fecha de apertura que defina el admin (ej. el día del grado).
- El día de apertura: animación de la cápsula abriéndose y notificación en el sitio.

### 5.9 Premios de la promoción 🏆
- Votaciones divertidas configurables por el admin: "Más probable que sea cirujano", "El que siempre llega tarde", "El mejor apuntes", "El alma de la fiesta", "Futuro ministro de salud".
- Cada estudiante vota una vez por categoría (con su código). Resultados revelados por el admin con animación tipo sobre dorado.

### 5.10 Profesores y agradecimientos
- Tarjetas de los docentes con foto, materia y mensajes de los estudiantes para ellos.
- Sección de agradecimiento a familias.

### 5.11 El Juramento
- Texto del juramento médico (el admin pega la versión que usarán en la ceremonia) que se revela **línea por línea** con el scroll, con tipografía serif grande y fondo blanco.
- Botón "Hice el juramento" que agrega la firma/foto del estudiante a un muro.

### 5.12 Modo Ceremonia (pantalla en vivo) 📽️
- Ruta `/en-vivo` pensada para **proyectar en el evento**.
- Muestra **casi en tiempo real** (sondeo cada 4–5 s, o Pusher/Ably si se activa) las fotos y mensajes que se suben durante la ceremonia, con transiciones tipo diapositiva, nombre del autor y música opcional.
- Un **QR grande** en una esquina para que familiares y estudiantes suban fotos desde el celular en ese momento.
- Modo "llamado a lista": el admin pulsa el nombre de cada estudiante y aparece su foto, apodo y frase en grande mientras recibe su bata.

### 5.13 Playlist y "Sonidos de la carrera"
- Embed de una playlist de Spotify/YouTube de la promoción (editable).
- Opción de audios cortos: notas de voz de los estudiantes.

### 5.14 Libro descargable 📖
- Botón que genera un **PDF tipo libro** con portada, mosaico, mensajes, perfiles y firmas, listo para imprimir.
- Opción de PDF individual por estudiante (sus recuerdos + lo que le escribieron).

---

## 6. Panel de administración y personalización en vivo

### Modo edición en la página (lo más importante)
Cuando el admin inicia sesión, aparece una **barra flotante** ("Modo edición") y puede:
- Hacer clic en cualquier texto para editarlo en línea.
- Cambiar imágenes de portada y fondos arrastrando una nueva.
- Reordenar secciones arrastrándolas (`@dnd-kit`).
- Mostrar/ocultar secciones con un interruptor.
- Vista previa móvil/escritorio.
- Guardar cambios con botón "Publicar" e historial para deshacer.

### Panel `/admin` (pestañas)
1. **Inicio:** estadísticas (fotos, videos, mensajes, estudiantes que aún no han subido nada → para recordarles).
2. **Promoción:** CRUD de estudiantes (nombre, apodo, foto, frase, rol especial como "representante"), importación desde CSV, generación de códigos y QR individuales.
3. **Moderación:** cola de aprobación, destacar con sello dorado, ocultar, eliminar.
4. **Tema:**
   - Selector de colores con vista previa en vivo (actualiza variables CSS).
   - Selector de tipografías (lista curada de Google Fonts).
   - Temas predefinidos: "Clínico" (teal + dorado), "Gala nocturna" (azul profundo + dorado, solo en acentos; el fondo sigue blanco), "Rosa pastel", "Institucional".
   - Intensidad de animaciones: Suave / Normal / Espectacular.
   - Estilo de tarjetas: redondeadas, polaroid, receta médica, nota adhesiva.
5. **Mosaico:** elegir modo, imagen objetivo del fotomosaico, forma, tamaño, blanco y negro sí/no.
6. **Línea de tiempo:** CRUD de hitos.
7. **Categorías:** crear/editar categorías de recuerdos con icono y color.
8. **Ceremonia:** fecha y hora de la cuenta regresiva, texto del juramento, configuración del modo en vivo, orden del llamado a lista.
9. **Cápsula del tiempo:** fecha de apertura.
10. **Premios:** crear categorías, abrir/cerrar votación, revelar resultados.
11. **Ajustes:** nombre del sitio, código de acceso, moderación sí/no, límites de tamaño de archivos, invitados sí/no, música, exportar todo (ZIP con fotos + JSON) y respaldo.

---

## 7. Experiencia de subida (debe ser muy fácil y bonita)

- Botón flotante "＋ Subir recuerdo" siempre visible (con un pequeño latido).
- Modal en pasos animados:
  1. ¿Quién eres? (si no está guardado) → buscador con fotos de la promoción.
  2. ¿Qué quieres subir? → Foto(s) · Video · Mensaje · Nota de voz · Firma.
  3. Arrastrar o tomar foto desde la cámara del celular; subida múltiple con barra de progreso animada por archivo.
  4. Detalles: título, descripción, semestre, categoría, etiquetar compañeros que salen en la foto.
  5. Confirmación con **confeti** y mensaje: "¡Tu recuerdo quedó guardado para siempre! 🩺".
- Compresión automática de imágenes, miniaturas de video, límite de tamaño configurable.
- Funciona perfecto en celular (la mayoría subirá desde ahí).
- **Los archivos NUNCA pasan por el servidor de Vercel**: van directo del celular a ImageKit (fotos) o a Cloudinary (videos). Los detalles están en la sección 13.
- Si la conexión se cae a mitad de la subida: reintento automático y mensaje amable ("Se fue el internet, reintentando…"). Lo que ya se subió no se pierde.
- Cola de subida visible: el usuario puede seguir navegando mientras sus archivos terminan de subirse.

---

## 8. Modelo de datos (Neon + Drizzle)

```sql
-- Configuración global del sitio (una sola fila, JSONB para flexibilidad)
admins (id, email unique, password_hash, created_at)

upload_intents (id, student_id fk, kind, storage_key, expected_bytes, content_type,
                confirmed bool default false, created_at)   -- para limpiar subidas huérfanas

site_settings (id, site_name, theme jsonb, sections jsonb, ceremony_at timestamptz,
               access_code_hash text, moderation_required bool, guests_enabled bool,
               capsule_open_at timestamptz, updated_at)

students (id, full_name, nickname, slug, avatar_url, quote, special_role,
          personal_token, order_index, created_at)

categories (id, name, icon, color, order_index)

memories (id, student_id fk, type enum('photo','video','message','audio','signature'),
          title, body, storage enum('imagekit','cloudinary'),
          imagekit_file_id, imagekit_file_path,          -- fotos (una sola versión; los tamaños son transformaciones)
          cloudinary_public_id,                          -- videos / audios
          width, height, duration_s, bytes, blurhash, semester,
          category_id fk, status enum('pending','approved','hidden'),
          featured bool, created_at)

memory_tags (memory_id fk, student_id fk)          -- compañeros etiquetados
messages_to (memory_id fk, recipient_student_id fk, recipient_label text) -- dedicatorias
reactions (id, memory_id fk, emoji, device_id, created_at)
comments (id, memory_id fk, author_name, body, status, created_at)
timeline_events (id, title, description, date, semester, cover_url, order_index)
teachers (id, name, subject, photo_url, order_index)
capsule_letters (id, student_id fk, body, media_url, created_at)   -- solo legible tras capsule_open_at
awards (id, title, description, status enum('open','closed','revealed'))
award_votes (award_id fk, voter_student_id fk, nominee_student_id fk, unique(award_id, voter_student_id))
guestbook (id, author_name, relationship, body, status, created_at)
```

- Neon no tiene políticas de acceso desde el navegador como Supabase: **el navegador nunca se conecta a la base de datos**. Todo pasa por Server Components / Server Actions que validan permisos: lectura pública solo de lo `approved`; escritura de estudiantes solo con código o token válido; todo lo demás solo el admin.
- Definir el esquema en `src/db/schema.ts` con Drizzle, migraciones con `drizzle-kit`, e índices en `memories(status, created_at)`, `memories(student_id)` y `memories(category_id)`.
- Usar el driver HTTP de Neon para consultas sueltas y el pooled connection string en producción.
- Las cartas de la cápsula no se exponen hasta la fecha de apertura (validar en servidor, no solo en el cliente).
- Rate limiting básico en las rutas de subida.

---

## 9. Animaciones clave (lista de verificación)

- [ ] Intro: bata que se dibuja + libro que se abre en 3D
- [ ] Texto del hero apareciendo palabra por palabra
- [ ] Línea ECG que late y que se dibuja con el scroll entre secciones
- [ ] Cuenta regresiva con números que giran (flip)
- [ ] Mosaico con entrada en cascada + hover que eleva y colorea
- [ ] Fotomosaico con zoom suave desde lejos hacia la foto individual
- [ ] Transición tipo **pasar página** entre secciones principales
- [ ] Notas/recetas que caen y se acomodan con resorte
- [ ] Reacciones con partículas de corazones/estetoscopios
- [ ] Lacre dorado sellando la cápsula del tiempo
- [ ] Sobre dorado revelando ganadores de premios
- [ ] Confeti al subir un recuerdo y el día de la ceremonia
- [ ] Cursor personalizado opcional (pequeño corazón o estetoscopio) en escritorio
- [ ] Skeletons elegantes mientras cargan las imágenes (blur placeholder)
- [ ] Todo respeta `prefers-reduced-motion`

---

## 10. Rendimiento, accesibilidad y calidad

- Imágenes con `next/image`, WebP/AVIF, lazy loading y placeholder borroso.
- Paginación infinita en la galería.
- Lighthouse ≥ 90 en rendimiento y accesibilidad en móvil.
- Contraste AA en todos los textos sobre blanco.
- Navegable con teclado; `alt` automático con el nombre del autor + título.
- Diseño mobile-first, probado en pantallas de 360px.
- SEO básico + imagen Open Graph bonita para compartir el enlace por WhatsApp.
- `noindex` opcional (activable) para que el sitio sea privado de buscadores.

---

## 11. Plan de construcción por fases

1. **Fase 1 – Base:** proyecto Next.js, Tailwind, tema con variables CSS, Neon (vía Marketplace de Vercel), esquema con Drizzle y migraciones, auth de admin, cuenta de ImageKit (Forever Free) con sus claves, cuenta de Cloudinary, despliegue inicial en Vercel con variables de entorno y cron.
2. **Fase 2 – Promoción y subida:** CRUD de estudiantes, código de acceso y flujos de subida directa de la sección 13 (fotos → ImageKit, videos → Cloudinary, mensajes y metadatos → Neon).
3. **Fase 3 – Galería y mosaico:** galería con filtros, lightbox, reacciones, mosaico en sus modos.
4. **Fase 4 – Secciones emotivas:** hero con cuenta regresiva, línea de tiempo, muro de recetas, firma la bata, juramento.
5. **Fase 5 – Admin y personalización:** modo edición en línea, panel completo, temas.
6. **Fase 6 – Extras:** cápsula del tiempo, premios, profesores, libro de visitas, playlist.
7. **Fase 7 – Ceremonia:** modo en vivo con sondeo (o Pusher/Ably), QR, llamado a lista.
8. **Fase 8 – Pulido:** intro del libro, animaciones finas, PDF descargable, rendimiento y pruebas en móvil.

**Prioridad si el tiempo es corto (la ceremonia es el 5 de diciembre):** Fases 1, 2, 3, el hero con cuenta regresiva, "Firma la bata" y el Modo Ceremonia. El resto se puede añadir después, porque el sitio sigue siendo el recuerdo de la promoción hasta el grado.

---

## 12. Entregables que espero de ti

- Antes de programar: resumen del plan, estructura de carpetas, esquema de BD y una **propuesta de dirección visual** (moodboard en texto: paleta, tipografías y los 3 momentos "wow" que harás primero) para que yo lo apruebe.
- Código limpio, tipado, con componentes reutilizables.
- Archivo `.env.example` y un `README.md` en español con: cómo configurar Neon, la cuenta de ImageKit (claves y URL endpoint) y Cloudinary, cómo correr las migraciones de Drizzle, cómo crear la cuenta admin, cómo desplegar en Vercel y cómo usar el panel.
- Datos de ejemplo (seed) con 10 estudiantes ficticios y recuerdos de prueba para ver el diseño lleno.
- Al terminar cada fase, dime qué quedó listo y qué sigue.

---

## 13. Subida de archivos, almacenamiento y despliegue en Vercel (OBLIGATORIO — leer antes de programar)

La app se despliega en **Vercel**, guarda los datos en **Neon**, las **fotos en ImageKit** y los **videos en Cloudinary**. Recibe fotos, videos y mensajes desde celulares. Hay límites reales que condicionan toda la arquitectura.

### 13.1 Arquitectura
```
                ┌─(foto comprimida, subida firmada)──▶ ImageKit  ──▶ visitantes (URLs con transformaciones)
Celular ────────┤
                ├─(video por partes, firma de Cloudinary)────▶ Cloudinary     ──▶ MP4 convertido + póster
                │
                └─(solo JSON pequeño)──▶ Vercel (Next.js, Server Actions) ──▶ Neon (textos y metadatos)
```

### 13.2 Límites que hay que respetar (verificar en la documentación actual al implementar)
| Servicio | Límite relevante |
|---|---|
| Vercel Functions (Route Handlers y Server Actions) | Cuerpo de la petición y de la respuesta: máximo **4.5 MB**. Si se pasa → error **413 FUNCTION_PAYLOAD_TOO_LARGE** |
| Neon Free | **1 GB** de Postgres por proyecto, **100 CU-horas**/mes, 5 GB de transferencia. Se suspende tras 5 min sin uso y despierta solo |
| ImageKit Forever Free | Almacenamiento, ancho de banda y transformaciones del plan gratuito: **verificar en el panel de ImageKit antes de la ceremonia** (no están confirmados en este documento) |
| Cloudinary Free | **25 créditos/mes** (almacenamiento + transformaciones + ancho de banda). Video de hasta ~100 MB por archivo. Cada segundo de video procesado consume créditos |

**Implicaciones:**
- **Fotos:** una sola versión de máximo 500 KB por foto. Cuántas fotos caben y cuánto ancho de banda se consume el día de la ceremonia depende de los límites del plan Forever Free: verificarlos antes de contar con ellos.
- **Videos:** Cloudinary queda solo para video, así que los créditos rinden mucho más. Aun así, hay que limitar la duración y servir 720p.
- **Neon:** cachear las lecturas para no gastar CU-horas (sección 13.8).

### 13.3 Regla de oro
**Ningún archivo pasa por una ruta de Next.js.** El servidor de Vercel solo:
1. Valida el código de acceso o el token del estudiante.
2. Entrega una **autorización de subida**: autorización firmada de ImageKit con `getUploadAuthParams` (fotos) o firma de Cloudinary (videos).
3. Guarda los **metadatos** en Neon.

Secretos (`IMAGEKIT_PRIVATE_KEY`, `CLOUDINARY_API_SECRET`, `DATABASE_URL`, `AUTH_SECRET`) **solo en el servidor**, nunca con el prefijo `NEXT_PUBLIC_`.

### 13.4 Configuración de ImageKit (fotos)
1. Crear cuenta en ImageKit en el plan **Forever Free** (sin tarjeta).
2. Copiar del panel: la **clave pública** (`NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`), la **clave privada** (`IMAGEKIT_PRIVATE_KEY`, solo servidor) y el **URL endpoint** (`NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`, p. ej. `https://ik.imagekit.io/tu_id`).
3. Verificar en la documentación actual de ImageKit: restricciones de dominio para la subida desde el navegador y la duración máxima de la autorización. La app usa 10 minutos.
4. Autorización en el servidor (`@imagekit/next/server`):
   ```ts
   import { getUploadAuthParams } from "@imagekit/next/server";
   const auth = getUploadAuthParams({
     publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
     privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
     expire: 600, // 10 minutos
   }); // { token, signature, expire } → se envían al cliente
   ```
5. Las imágenes se sirven **siempre** por URL de transformación (ver 13.5). El archivo original nunca se muestra en el mosaico ni en la galería.

### 13.5 Flujo de FOTOS (ImageKit)
1. El cliente recibe la foto. Si es **HEIC** (iPhone), la convierte a JPEG con `heic2any`.
2. Corrige la orientación EXIF y **elimina los metadatos (GPS)** por privacidad. Al redibujar en canvas, los metadatos se pierden solos.
3. Genera **una sola versión** en un **Web Worker**: lado mayor máximo **2048 px**, WebP o JPEG, con calidad ajustada hasta quedar **por debajo de 500 KB**. Calcula `width`, `height`, `bytes` y un **blurhash**.
4. Server Action `requestPhotoUpload({ studentToken, bytes, contentType })`:
   - Valida el token, el rate limit, que `contentType` sea de imagen permitido y que `bytes` no supere 500 KB.
   - Devuelve la autorización de `getUploadAuthParams` (13.4) y registra la intención en `upload_intents`.
5. El cliente sube el archivo a ImageKit con esa autorización, en la carpeta `bata-blanca/fotos/{studentId}/` y con nombre UUID. Usa XHR para la barra de progreso y reintentos automáticos.
6. Server Action `confirmMemory({ intentId, ... })`: consulta el archivo en la API de ImageKit (`fileId`, tamaño, tipo, ruta).
   - Si no existe, pesa más de lo permitido o no es una imagen, lo **borra en ImageKit** y rechaza la subida.
   - Si es válido, guarda `imagekit_file_id`, `imagekit_file_path` y los metadatos en Neon, con el `status` que indique la moderación.
   - La firma de ImageKit no fija tamaño ni tipo; por eso la validación está en este paso y no en la firma.
7. Tamaños de visualización por **transformación de URL**, con nombres fijos definidos en `src/lib/image-sizes.ts` (se pueden crear también como transformaciones nombradas en el panel de ImageKit):
   - `thumb`: 400 px cuadrada, recortada al centro → mosaico y fotomosaico.
   - `gallery`: 1080 px de lado mayor → galería.
   - `lightbox`: 1920 px de lado mayor → lightbox y exportación.
   La sintaxis exacta de las transformaciones se verifica en la documentación actual al implementar.
8. Se usan con `next/image` + `unoptimized` o un loader propio que elija el tamaño según el uso.

### 13.6 Flujo de VIDEOS y notas de voz (Cloudinary)
1. Validar en el cliente: **duración máxima configurable** (60 s por defecto) y **tamaño máximo de 100 MB**. Si se pasa, mensaje amable con la sugerencia de recortarlo desde la galería del celular.
2. Server Action `requestVideoSignature({ studentToken })` → firma (`cloudinary.utils.api_sign_request`) con `timestamp`, `folder: 'bata-blanca/videos/{studentId}'`, `public_id` (UUID), `tags: 'unconfirmed'` y `allowed_formats`. **Nunca usar presets sin firma (unsigned).**
3. Subida directa a `https://api.cloudinary.com/v1_1/{cloud}/video/upload` **por partes** (chunks de 6 MB con cabeceras `X-Unique-Upload-Id` y `Content-Range`), para que funcione con datos móviles y se pueda reanudar si falla.
4. `confirmMemory` verifica el recurso con la Admin API, le quita la etiqueta `unconfirmed` y guarda `public_id`, duración, ancho, alto y bytes.
5. Reproducción con transformaciones fijas: `f_auto,q_auto,w_1280` (esto convierte los `.mov` HEVC del iPhone) y vista previa a 720p. Póster: `so_1` en JPG. Los videos usan `preload="none"` y solo cargan cuando el usuario pulsa reproducir.
6. Notas de voz: mismo flujo (`resource_type: video`), con un máximo de 60 s.
7. Opcional: el admin puede pegar un **enlace de YouTube (no listado)** para videos largos (resumen de la carrera, grabación de la ceremonia), que se muestran incrustados con `lite-youtube-embed`, sin gastar créditos.

### 13.7 Flujo de MENSAJES y firmas
- Texto (y HTML saneado de Tiptap) vía Server Action normal, porque pesa muy poco. Se guarda en Neon.
- Sanear el HTML en el servidor (`isomorphic-dompurify`), con un máximo de 2.000 caracteres.
- Las **firmas de la bata** se guardan como **SVG** (trazos del canvas) en una columna de texto de Neon. Si se necesita PNG para descargar, se genera en el cliente al momento.

### 13.8 Caché y rendimiento
- Las páginas públicas (galería, mosaico, perfiles) usan **ISR / `unstable_cache`** con etiquetas (`revalidateTag('memories')`) que se invalidan al subir o aprobar algo. Así la mayoría de visitas no despiertan a Neon.
- El endpoint del modo en vivo `/api/live?since=<timestamp>` devuelve solo lo nuevo, con `Cache-Control: s-maxage=3, stale-while-revalidate=10`. El cliente consulta cada 4–5 s con SWR. Opcional: Pusher/Ably para tiempo real verdadero.
- Paginación por cursor (`created_at`, `id`) en la galería.
- Las imágenes del mosaico usan siempre la versión `thumb`. El fotomosaico se arma en un `<canvas>` con las miniaturas.
- `remotePatterns` en `next.config.ts` para `ik.imagekit.io` y `res.cloudinary.com`.

### 13.9 Seguridad y abuso
- Tokens de estudiante y código de acceso validados **siempre en el servidor**. El código de acceso se guarda con hash.
- **Rate limit** por estudiante y por IP en `requestPhotoUpload` y `requestVideoSignature` (ej. 40 archivos por hora), con una tabla `rate_limits` en Neon o `@upstash/ratelimit`.
- Autorización de ImageKit con expiración corta (10 min). ImageKit no fija tamaño ni tipo en la firma: se valida en `confirmMemory` y se borra lo que no cumple.
- Validar el tipo real del archivo antes de procesarlo (magic bytes) y no solo la extensión.
- **Limpieza de huérfanos** (archivos subidos pero nunca confirmados):
  - ImageKit: el cron borra por la API de archivos los `upload_intents` no confirmados con más de 24 h.
  - Cloudinary: el cron borra los recursos con la etiqueta `unconfirmed` de más de 24 h.
- Cuando el admin elimina un recuerdo, borrar también sus archivos en ImageKit o Cloudinary.

### 13.10 Panel de admin: monitor de recursos
En la pestaña **Inicio** del panel mostrar:
- **ImageKit:** almacenamiento usado (suma de `bytes` en Neon frente al límite del plan, a verificar) y número de fotos.
- **Cloudinary:** créditos usados en el mes (Admin API `usage`), y número y minutos de videos.
- **Neon:** tamaño de la BD (`pg_database_size`).
- Alerta visual al 80% de cualquiera, con sugerencias: bajar la calidad, limitar los videos o subir de plan.
- Botón **"Exportar todo"**: ZIP con todas las fotos en tamaño `lightbox` (desde ImageKit), los videos (desde Cloudinary) y los mensajes en JSON/PDF. Generarlo **en el cliente** con `jszip` + `streamsaver` o por lotes, porque una función de Vercel no puede devolver más de 4.5 MB.

### 13.11 Configuración específica de Vercel
- Instalar Neon desde el **Marketplace de Vercel** (crea `DATABASE_URL` automáticamente).
- **Vercel Cron** diario en `/api/cron/cleanup` (protegido con `CRON_SECRET`) para la limpieza de huérfanos.
- `export const runtime = 'nodejs'` en las rutas que usen el SDK de AWS, Cloudinary o bcrypt.
- Variables de entorno (`.env.example`):
  ```
  # Base de datos (Neon)
  DATABASE_URL=                 # pooled
  DATABASE_URL_UNPOOLED=        # directa, para migraciones de drizzle-kit
  # Auth del admin
  AUTH_SECRET=
  ADMIN_EMAIL=
  ADMIN_PASSWORD_HASH=          # o crear el admin con un script seed
  # Fotos (ImageKit)
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
  IMAGEKIT_PRIVATE_KEY=
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=   # https://ik.imagekit.io/tu_id
  # Videos (Cloudinary)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  # Otros
  CRON_SECRET=
  NEXT_PUBLIC_SITE_URL=
  # Opcional, tiempo real verdadero:
  # PUSHER_APP_ID= PUSHER_KEY= PUSHER_SECRET= NEXT_PUBLIC_PUSHER_CLUSTER=
  ```
- `vercel.json` con la definición del cron.
- Scripts en `package.json`: `db:generate`, `db:migrate`, `db:seed`, `db:studio`.

### 13.12 Pruebas obligatorias antes del 5 de diciembre
- Subir 10 fotos a la vez desde un Android y un iPhone con datos móviles.
- Subir una foto HEIC, un video `.mov` de iPhone de 60 s y un video de Android, y comprobar que se ven en Chrome, Safari y Android.
- Cortar el internet a mitad de un video y comprobar que se reanuda.
- Intentar subir un archivo de 200 MB, uno con extensión falsa y un archivo que no sea imagen → deben rechazarse con un mensaje claro y quedar borrados en ImageKit.
- Comprobar que las subidas desde un dominio no permitido fallan por CORS.
- Abrir `/en-vivo` en un proyector, subir fotos desde 5 celulares al tiempo y comprobar que aparecen en menos de 10 s.
- Dejar la app 10 minutos sin uso y comprobar que la primera carga (Neon despertando) sigue siendo aceptable.
- Revisar que en producción no aparezca ningún secreto en el bundle del cliente.

---

## 14. Dirección de arte y animaciones (OBLIGATORIO — mismo peso que la sección 13)

### 14.1 Concepto visual: "Un libro de recuerdos sobre una bata blanca"
- La página entera se siente como **papel fino y tela blanca**: fondo `#FFFFFF`, una textura de grano casi invisible (SVG noise al 2–3% de opacidad) y sombras muy suaves y largas, como objetos reales sobre una mesa.
- Las fotos se ven como **objetos físicos**: polaroids con borde blanco, cinta adhesiva semitransparente en las esquinas, una leve rotación aleatoria (−3° a 3°) y una sombra que crece al pasar el cursor.
- Los mensajes se ven escritos a mano sobre **recetas médicas**, con membrete y línea para la firma.
- Detalles dorados (`#C9A227`) con un **brillo que recorre el texto** cada cierto tiempo (gradiente animado en `background-clip: text`) en títulos importantes: el nombre de la promoción, "5 de diciembre" y los premios.
- **Nada genérico:** prohibido el look de plantilla (tarjetas grises idénticas, hero centrado con botón azul, iconos de librería sin personalizar). Cada sección debe tener una composición propia.

### 14.2 Sistema de movimiento (consistente en todo el sitio)
| Token | Valor | Uso |
|---|---|---|
| `ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entradas y apariciones |
| `ease-page` | `cubic-bezier(0.65, 0, 0.35, 1)` | Pasar página, transiciones grandes |
| `spring-paper` | `{ type: 'spring', stiffness: 120, damping: 14, mass: 0.8 }` | Fotos y notas que caen y se acomodan |
| `spring-snappy` | `{ stiffness: 400, damping: 30 }` | Botones, toggles, reacciones |
| Duraciones | 150 ms (micro), 400 ms (componentes), 800–1200 ms (escenas) | — |
| Escalonado | 40–80 ms entre elementos de una lista | Galería, mosaico, letras |

Centralizar estos valores en `src/lib/motion.ts` y usarlos en todo el sitio.

### 14.3 Momentos "wow" (los que la gente va a grabar con el celular y compartir)
1. **Intro:** la bata blanca se dibuja con trazo SVG (1.5 s). Del bolsillo sale un **estetoscopio** que forma la línea del electrocardiograma y late tres veces. El latido se convierte en el título dorado "Promoción Medicina 2026" y el libro se abre en 3D.
2. **Latido global:** una línea ECG muy fina recorre la parte superior de la página y late suavemente. Cuando alguien sube un recuerdo, da un **pico de latido** y un pulso de luz.
3. **Mosaico que se arma:** al hacer scroll, cientos de miniaturas vuelan desde los bordes y **se acomodan formando una bata, un corazón o "2026"** (GSAP + ScrollTrigger con `scrub`). Al terminar, una luz dorada recorre la figura.
4. **Pasar página:** entre los capítulos (semestres) la pantalla se dobla como una hoja real (efecto `page-curl` con CSS 3D o `react-pageflip`), con sombra en el pliegue.
5. **Firma la bata:** cada nueva firma aparece **escribiéndose sola** (animación del trazo SVG en el orden en que se dibujó), con un brillito de tinta.
6. **Cápsula del tiempo:** al sellarla, cae un **sello de lacre dorado** que rebota, se aplana con un "squash" y deja partículas.
7. **Cuenta regresiva:** números tipo marcador que giran (flip) y laten al ritmo del ECG. En el último minuto el fondo se llena lentamente de partículas doradas. A las 00:00 hay confeti en forma de corazones, estetoscopios y cruces médicas.
8. **Llamado a lista (modo ceremonia):** la foto del estudiante entra con zoom suave, su nombre se escribe letra por letra con un destello dorado y su frase aparece debajo, mientras el ECG late de fondo.

### 14.4 Microinteracciones (los detalles que hacen que se sienta especial)
- **Cursor personalizado** en escritorio: un punto suave que se agranda sobre fotos y muestra "Ver" o "▶". Se desactiva en dispositivos táctiles.
- **Botones magnéticos:** se atraen levemente hacia el cursor.
- **Hover de foto:** se eleva, se endereza (rotación a 0°), la sombra crece y aparece el avatar del autor deslizándose desde abajo.
- **Reacciones:** al tocar ❤️, salen de 6 a 10 partículas del mismo emoji con física. El contador sube con un "rodillo" numérico.
- **Botón "Subir recuerdo":** late cada 6 s. Al abrirlo, el botón se transforma en el modal (shared layout animation con `layoutId`).
- **Barra de progreso de subida:** es una línea ECG que avanza y late. Al llegar al 100% hace un "¡bip!" visual (sin sonido por defecto) y lanza confeti.
- **Estados vacíos con personalidad:** si una sección no tiene contenido, mostrar una ilustración de línea con un texto cálido ("Aún no hay fotos de este semestre… ¿tú tienes alguna? 📸").
- **Skeletons** con brillo tipo papel, y blurhash que se desvanece hacia la foto real.
- **Easter egg:** escribir "bata" con el teclado (o tocar 5 veces el escudo) lanza una lluvia de mini batas blancas.

### 14.5 Tipografía en movimiento
- Títulos de sección: las letras aparecen de abajo hacia arriba, con máscara, escalonadas por palabra (`SplitType` o el split de GSAP).
- Frases emotivas grandes (juramento, dedicatorias destacadas): el texto se "ilumina" palabra por palabra según el scroll (de gris claro a color pleno).
- Mensajes manuscritos: efecto de escritura a mano (revelado con máscara de izquierda a derecha).

### 14.6 Color y luz
- Además del blanco, usar **degradados de luz muy sutiles** (radiales, al 6–10% de opacidad) en teal y dorado detrás de las secciones clave, como una luz de quirófano suave.
- Los acentos de color se reservan para lo importante: no pintar todo. Proporción aproximada: 85% blanco/neutros, 10% teal/azul, 5% dorado/rosa.
- Las fotos pueden mostrarse en blanco y negro dentro del mosaico y **colorearse con una transición de 600 ms** al pasar el cursor o al entrar en el centro de la pantalla (en móvil).

### 14.7 Móvil primero (la mayoría lo verá desde el celular)
- Todas las escenas "wow" deben verse espectaculares en una pantalla de 390 px de ancho, y no solo en escritorio.
- Gestos: deslizar entre fotos, mantener presionado para reaccionar y doble toque para ❤️ (como Instagram).
- Retroalimentación háptica (`navigator.vibrate(10)`) al reaccionar y al terminar una subida, donde el navegador lo soporte.
- Mantener 60 fps: animar solo `transform` y `opacity`, usar `will-change` con moderación, evitar sombras animadas pesadas en Android de gama media (degradar automáticamente si `navigator.hardwareConcurrency <= 4`).

### 14.8 Accesibilidad sin perder la magia
- Con `prefers-reduced-motion`: intro corta (fundido de 600 ms), sin parallax, sin scroll-jacking, y el confeti reemplazado por un destello suave.
- Interruptor visible "✨ Animaciones: completas / suaves" en el pie de página. La elección se guarda.
- Nunca bloquear el contenido detrás de una animación: siempre se puede saltar.

### 14.9 Criterio de aceptación visual
Antes de dar por terminada cada fase, el agente debe:
1. Tomar capturas o grabar un GIF de la sección en móvil (390 px) y escritorio (1440 px).
2. Revisar: ¿tiene al menos un detalle que sorprenda? ¿Se siente como un libro de recuerdos y no como un panel de administración? ¿El blanco domina y los acentos se usan con intención?
3. Si la respuesta a alguna es "no", iterar el diseño antes de seguir.
