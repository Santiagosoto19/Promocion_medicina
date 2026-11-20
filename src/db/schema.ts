import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  uniqueIndex,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Fase 1: administración, configuración, rate limit y auditoría.
// Fase 2+: estudiantes, categorías y recuerdos.

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

// Una sola fila (id = 1). Toda la personalización vive aquí.
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey(),
  siteName: text("site_name").notNull().default("Bata Blanca"),
  theme: jsonb("theme").$type<Record<string, string>>().notNull().default({}),
  sections: jsonb("sections").$type<unknown[]>().notNull().default([]),
  ceremonyAt: timestamp("ceremony_at", { withTimezone: true }),
  // Por defecto: todo recuerdo nuevo queda pendiente hasta que el admin lo apruebe.
  moderationRequired: boolean("moderation_required").notNull().default(true),
  guestsEnabled: boolean("guests_enabled").notNull().default(false),
  // Por defecto el sitio no aparece en buscadores.
  noindex: boolean("noindex").notNull().default(true),
  capsuleOpenAt: timestamp("capsule_open_at", { withTimezone: true }),
  // Estudiante que se está llamando en el modo ceremonia (null = nadie).
  liveCallStudentId: uuid("live_call_student_id"),
  liveCallAt: timestamp("live_call_at", { withTimezone: true }),
  // Texto del juramento que el admin pega; se revela línea por línea.
  oathText: text("oath_text"),
  // Textos editables de la portada y foto objetivo del fotomosaico.
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  mosaicTargetPath: text("mosaic_target_path"),
  // Enlace de la playlist de la promoción (Spotify o YouTube, opcional).
  playlistUrl: text("playlist_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    nickname: text("nickname"),
    slug: text("slug").notNull().unique(),
    avatarUrl: text("avatar_url"),
    quote: text("quote"),
    specialRole: text("special_role"),
    personalToken: text("personal_token").unique(),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: createdAt(),
  },
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const memoryType = pgEnum("memory_type", [
  "photo",
  "video",
  "message",
  "audio",
  "signature",
]);

// pending: esperando moderación. approved: visible. hidden: ocultado por el admin.
// Nunca se borra un recuerdo de forma automática; "eliminar" es una acción explícita y auditada.
export const memoryStatus = pgEnum("memory_status", [
  "pending",
  "approved",
  "hidden",
]);

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    type: memoryType("type").notNull(),
    title: text("title"),
    body: text("body"),
    storage: text("storage"), // 'imagekit' | 'cloudinary'
    imagekitFileId: text("imagekit_file_id"),
    imagekitFilePath: text("imagekit_file_path"),
    cloudinaryPublicId: text("cloudinary_public_id"),
    width: integer("width"),
    height: integer("height"),
    durationS: integer("duration_s"),
    bytes: bigint("bytes", { mode: "number" }),
    blurhash: text("blurhash"),
    semester: text("semester"),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    status: memoryStatus("status").notNull().default("pending"),
    featured: boolean("featured").notNull().default(false),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("memories_status_created_idx").on(t.status, t.createdAt),
    index("memories_student_idx").on(t.studentId),
    index("memories_category_idx").on(t.categoryId),
  ],
);

// Reacciones (❤️ 🩺 😂 🥹 👏). Una por emoji y dispositivo; tocar otra vez la quita.
export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryId: uuid("memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    deviceId: text("device_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("reactions_unique_idx").on(t.memoryId, t.emoji, t.deviceId)],
);

// Línea de tiempo "Historia clínica de la promoción".
export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("event_date"), // texto libre: "Semestre 4 · marzo 2025"
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: createdAt(),
});

// Cápsula del tiempo: se lee solo después de siteSettings.capsuleOpenAt.
export const capsuleLetters = pgTable("capsule_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "restrict" }),
  body: text("body").notNull(),
  status: memoryStatus("status").notNull().default("pending"),
  createdAt: createdAt(),
});

// Premios de la promoción: votación de una vez por categoría y persona.
export const awards = pgTable("awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"), // open | closed | revealed
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: createdAt(),
});

export const awardVotes = pgTable(
  "award_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    awardId: uuid("award_id")
      .notNull()
      .references(() => awards.id, { onDelete: "cascade" }),
    voterStudentId: uuid("voter_student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    nomineeStudentId: uuid("nominee_student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("award_votes_unique_idx").on(t.awardId, t.voterStudentId)],
);

// Profesores: tarjetas con foto (URL de ImageKit opcional) y materia.
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subject: text("subject"),
  photoPath: text("photo_path"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: createdAt(),
});

// Libro de visitas: familiares e invitados, con moderación.
export const guestbook = pgTable("guestbook", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorName: text("author_name").notNull(),
  relationship: text("relationship"),
  body: text("body").notNull(),
  status: memoryStatus("status").notNull().default("pending"),
  createdAt: createdAt(),
});

// Subidas pendientes: si nunca se confirman, el cron las limpia.
export const uploadIntents = pgTable("upload_intents", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  storageKey: text("storage_key").notNull(),
  expectedBytes: bigint("expected_bytes", { mode: "number" }),
  contentType: text("content_type"),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: createdAt(),
});

// Contador por ventana de tiempo (login, subidas, etc.).
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

// Registro de todo lo que hace el admin (y los intentos de acceso). Solo se agrega, nunca se edita.
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor: text("actor").notNull(), // email del admin o 'sistema' / 'anonimo'
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);
