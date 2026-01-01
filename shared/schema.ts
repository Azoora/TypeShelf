import { pgTable, text, serial, integer, boolean, timestamp, uuid, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  status: text("status").notNull().default("ok"), // 'ok' | 'missing' | 'error'
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fontFiles = pgTable("font_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: 'cascade' }),
  fullPath: text("full_path").notNull(),
  relPath: text("rel_path").notNull(),
  filename: text("filename").notNull(),
  ext: text("ext").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  mtimeMs: bigint("mtime_ms", { mode: "number" }).notNull(),
  sha1: text("sha1").notNull(),
  urlKey: text("url_key").notNull().unique(), // Stable key for serving
  duplicateGroupKey: text("duplicate_group_key"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fontFaces = pgTable("font_faces", {
  id: uuid("id").primaryKey().defaultRandom(),
  fontFileId: uuid("font_file_id").references(() => fontFiles.id, { onDelete: 'cascade' }),
  family: text("family").notNull(),
  subfamily: text("subfamily").notNull(),
  postscriptName: text("postscript_name"),
  weight: integer("weight"),
  italic: boolean("italic").default(false),
  stretch: text("stretch"),
  version: text("version"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetType: text("target_type").notNull(), // 'family' | 'face' | 'file'
  targetId: text("target_id").notNull(),     // Family Name or UUID
  createdAt: timestamp("created_at").defaultNow(),
});

export const collectionItems = pgTable("collection_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").references(() => collections.id, { onDelete: 'cascade' }),
  targetType: text("target_type").notNull(), // 'family' | 'face' | 'file'
  targetId: text("target_id").notNull(),     // Family Name or UUID
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const categoriesRelations = relations(categories, ({ many }) => ({
  fontFiles: many(fontFiles),
}));

export const fontFilesRelations = relations(fontFiles, ({ one, many }) => ({
  category: one(categories, {
    fields: [fontFiles.categoryId],
    references: [categories.id],
  }),
  faces: many(fontFaces),
}));

export const fontFacesRelations = relations(fontFaces, ({ one }) => ({
  file: one(fontFiles, {
    fields: [fontFaces.fontFileId],
    references: [fontFiles.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFontFileSchema = createInsertSchema(fontFiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFontFaceSchema = createInsertSchema(fontFaces).omit({ id: true, createdAt: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true, createdAt: true });
export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({ id: true, createdAt: true });

// === TYPES ===

export type Category = typeof categories.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type FontFile = typeof fontFiles.$inferSelect;
export type FontFace = typeof fontFaces.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type CollectionItem = typeof collectionItems.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type InsertFontFile = z.infer<typeof insertFontFileSchema>;
export type InsertFontFace = z.infer<typeof insertFontFaceSchema>;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;

// Helper for type-safe API responses
export const api = {} as any;
export const buildUrl = (path: string, params: Record<string, string | number> = {}) => {
  let url = path;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, encodeURIComponent(String(value)));
  }
  return url;
};
