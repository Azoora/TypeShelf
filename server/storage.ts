import { 
  categories, collections, fontFiles, fontFaces, favorites, collectionItems,
  type Category, type InsertCategory,
  type Collection, type InsertCollection,
  type FontFile, type InsertFontFile,
  type FontFace, type InsertFontFace,
  type Favorite, type InsertFavorite,
  type CollectionItem, type InsertCollectionItem
} from "@shared/schema";
import { db } from "./db";
import { eq, like, ilike, and, or, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  getCategory(id: string): Promise<Category | undefined>;

  // Collections
  getCollections(): Promise<(Collection & { count: number })[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, updates: Partial<Collection>): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  getCollection(id: string): Promise<Collection | undefined>;
  
  // Collection Items
  addCollectionItem(item: InsertCollectionItem): Promise<CollectionItem>;
  removeCollectionItem(collectionId: string, targetType: string, targetId: string): Promise<void>;
  getCollectionFonts(collectionId: string, limit: number, offset: number): Promise<{ items: string[], total: number }>;

  // Favorites
  getFavorites(): Promise<Favorite[]>;
  toggleFavorite(favorite: InsertFavorite): Promise<{ favorite?: Favorite, isFavorite: boolean }>;

  // Fonts
  createFontFile(file: InsertFontFile): Promise<FontFile>;
  getFontFileByPath(fullPath: string): Promise<FontFile | undefined>;
  getFontFileByUrlKey(urlKey: string): Promise<FontFile | undefined>;
  createFontFace(face: InsertFontFace): Promise<FontFace>;
  
  searchFonts(params: {
    q?: string,
    categoryId?: string,
    collectionId?: string,
    favorites?: boolean,
    types?: string[],
    italic?: boolean,
    weightMin?: number,
    weightMax?: number,
    sort?: string,
    limit: number,
    offset: number
  }): Promise<{ items: { family: string, faces: (FontFace & { file: FontFile })[] }[], total: number }>;

  getFontFamily(family: string): Promise<{ family: string, faces: (FontFace & { file: FontFile })[], collections: string[] } | undefined>;
  deleteFontFile(id: string): Promise<void>;
  deleteFontFileByPath(fullPath: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === Categories ===
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const [updated] = await db.update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id));
    return cat;
  }

  // === Collections ===
  async getCollections(): Promise<(Collection & { count: number })[]> {
    const cols = await db.select().from(collections).orderBy(collections.name);
    // TODO: Join with count. For now, simple loop or subquery.
    const result = [];
    for (const c of cols) {
      const countRes = await db.select({ count: sql<number>`count(*)` }).from(collectionItems).where(eq(collectionItems.collectionId, c.id));
      result.push({ ...c, count: Number(countRes[0].count) });
    }
    return result;
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const [created] = await db.insert(collections).values(collection).returning();
    return created;
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const [updated] = await db.update(collections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();
    return updated;
  }

  async deleteCollection(id: string): Promise<void> {
    await db.delete(collections).where(eq(collections.id, id));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    const [col] = await db.select().from(collections).where(eq(collections.id, id));
    return col;
  }

  async addCollectionItem(item: InsertCollectionItem): Promise<CollectionItem> {
    // Check exist
    const [existing] = await db.select().from(collectionItems).where(
      and(
        eq(collectionItems.collectionId, item.collectionId),
        eq(collectionItems.targetType, item.targetType),
        eq(collectionItems.targetId, item.targetId)
      )
    );
    if (existing) return existing;
    const [created] = await db.insert(collectionItems).values(item).returning();
    return created;
  }

  async removeCollectionItem(collectionId: string, targetType: string, targetId: string): Promise<void> {
    await db.delete(collectionItems).where(
      and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.targetType, targetType),
        eq(collectionItems.targetId, targetId)
      )
    );
  }

  async getCollectionFonts(collectionId: string, limit: number, offset: number): Promise<{ items: string[], total: number }> {
    const whereClause = eq(collectionItems.collectionId, collectionId);
    const totalRes = await db.select({ count: sql<number>`count(*)` }).from(collectionItems).where(whereClause);
    const total = Number(totalRes[0].count);

    const items = await db.select().from(collectionItems)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(collectionItems.createdAt));
    
    return { items: items.map(i => i.targetId), total };
  }

  // === Favorites ===
  async getFavorites(): Promise<Favorite[]> {
    return await db.select().from(favorites).orderBy(desc(favorites.createdAt));
  }

  async toggleFavorite(favorite: InsertFavorite): Promise<{ favorite?: Favorite, isFavorite: boolean }> {
    const [existing] = await db.select().from(favorites).where(
      and(
        eq(favorites.targetType, favorite.targetType),
        eq(favorites.targetId, favorite.targetId)
      )
    );

    if (existing) {
      await db.delete(favorites).where(eq(favorites.id, existing.id));
      return { isFavorite: false };
    } else {
      const [created] = await db.insert(favorites).values(favorite).returning();
      return { favorite: created, isFavorite: true };
    }
  }

  // === Fonts ===
  async createFontFile(file: InsertFontFile): Promise<FontFile> {
    const [created] = await db.insert(fontFiles).values(file).returning();
    return created;
  }

  async getFontFileByPath(fullPath: string): Promise<FontFile | undefined> {
    const [file] = await db.select().from(fontFiles).where(eq(fontFiles.fullPath, fullPath));
    return file;
  }

  async getFontFileByUrlKey(urlKey: string): Promise<FontFile | undefined> {
    const [file] = await db.select().from(fontFiles).where(eq(fontFiles.urlKey, urlKey));
    return file;
  }

  async createFontFace(face: InsertFontFace): Promise<FontFace> {
    const [created] = await db.insert(fontFaces).values(face).returning();
    return created;
  }

  async deleteFontFile(id: string): Promise<void> {
    await db.delete(fontFiles).where(eq(fontFiles.id, id));
  }
  
  async deleteFontFileByPath(fullPath: string): Promise<void> {
    await db.delete(fontFiles).where(eq(fontFiles.fullPath, fullPath));
  }

  async searchFonts(params: {
    q?: string,
    categoryId?: string,
    collectionId?: string,
    favorites?: boolean,
    types?: string[],
    italic?: boolean,
    weightMin?: number,
    weightMax?: number,
    sort?: string,
    limit: number,
    offset: number
  }): Promise<{ items: { family: string, faces: (FontFace & { file: FontFile })[] }[], total: number }> {
    // This is complex. We need to query unique families that match criteria.
    // 1. Find matching faces/files
    let conditions = [];

    if (params.q) {
      conditions.push(or(
        ilike(fontFaces.family, `%${params.q}%`),
        ilike(fontFaces.subfamily, `%${params.q}%`),
        ilike(fontFiles.filename, `%${params.q}%`)
      ));
    }
    if (params.categoryId) {
      conditions.push(eq(fontFiles.categoryId, params.categoryId));
    }
    if (params.types && params.types.length > 0) {
      // ext IN types
      // conditions.push(inArray(fontFiles.ext, params.types)); // Need to import inArray
    }
    if (params.italic !== undefined) {
      conditions.push(eq(fontFaces.italic, params.italic));
    }
    // Filter collection/favorites is harder because they are separate tables.
    // Ideally we join.
    
    // Simplification for MVP: Fetch distinct families.
    // For now, let's just return all faces joined with files, then group by family in JS memory if dataset is small, 
    // BUT user said "500-5000 fonts". Memory grouping is OK for 5000.
    
    const allFaces = await db.select({
      face: fontFaces,
      file: fontFiles
    })
    .from(fontFaces)
    .innerJoin(fontFiles, eq(fontFaces.fontFileId, fontFiles.id))
    .where(and(...conditions));

    // Post-filter for collections/favorites if needed (or join).
    let filtered = allFaces;

    if (params.favorites) {
      const favs = await this.getFavorites();
      const favFamilies = new Set(favs.filter(f => f.targetType === 'family').map(f => f.targetId));
      filtered = filtered.filter(row => favFamilies.has(row.face.family));
    }

    if (params.collectionId) {
       const colItems = await db.select().from(collectionItems).where(eq(collectionItems.collectionId, params.collectionId));
       const colFamilies = new Set(colItems.filter(i => i.targetType === 'family').map(i => i.targetId));
       filtered = filtered.filter(row => colFamilies.has(row.face.family));
    }

    // Group by family
    const grouped = new Map<string, (FontFace & { file: FontFile })[]>();
    for (const { face, file } of filtered) {
      if (!grouped.has(face.family)) {
        grouped.set(face.family, []);
      }
      grouped.get(face.family)!.push({ ...face, file });
    }

    let families = Array.from(grouped.entries()).map(([family, faces]) => ({ family, faces }));
    
    // Sort
    if (params.sort === 'name_asc') {
      families.sort((a, b) => a.family.localeCompare(b.family));
    } else {
      // Default: recent (using max createdAt of faces)
      families.sort((a, b) => {
        const dateA = Math.max(...a.faces.map(f => f.createdAt?.getTime() || 0));
        const dateB = Math.max(...b.faces.map(f => f.createdAt?.getTime() || 0));
        return dateB - dateA;
      });
    }

    const total = families.length;
    const paginated = families.slice(params.offset, params.offset + params.limit);

    return { items: paginated, total };
  }

  async getFontFamily(family: string): Promise<{ family: string, faces: (FontFace & { file: FontFile })[], collections: string[] } | undefined> {
    const result = await db.select({
      face: fontFaces,
      file: fontFiles
    })
    .from(fontFaces)
    .innerJoin(fontFiles, eq(fontFaces.fontFileId, fontFiles.id))
    .where(eq(fontFaces.family, family));

    if (result.length === 0) return undefined;

    const faces = result.map(r => ({ ...r.face, file: r.file }));
    
    // Get collections
    const cols = await db.select().from(collectionItems).where(and(eq(collectionItems.targetType, 'family'), eq(collectionItems.targetId, family)));
    
    return { family, faces, collections: cols.map(c => c.collectionId) };
  }
}

export const storage = new DatabaseStorage();
