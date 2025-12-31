import * as fs from "fs";
import * as path from "path";
import { 
  type Category, type InsertCategory,
  type Collection, type InsertCollection,
  type FontFile, type InsertFontFile,
  type FontFace, type InsertFontFace,
  type Favorite, type InsertFavorite,
  type CollectionItem, type InsertCollectionItem
} from "@shared/schema";

// File paths
const DATA_DIR = path.resolve("data");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const COLLECTIONS_FILE = path.join(DATA_DIR, "collections.json");
const FONT_FILES_FILE = path.join(DATA_DIR, "font_files.json");
const FONT_FACES_FILE = path.join(DATA_DIR, "font_faces.json");
const FAVORITES_FILE = path.join(DATA_DIR, "favorites.json");
const COLLECTION_ITEMS_FILE = path.join(DATA_DIR, "collection_items.json");

export interface IStorage {
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  getCategory(id: string): Promise<Category | undefined>;

  getCollections(): Promise<(Collection & { count: number })[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, updates: Partial<Collection>): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  getCollection(id: string): Promise<Collection | undefined>;
  
  addCollectionItem(item: InsertCollectionItem): Promise<CollectionItem>;
  removeCollectionItem(collectionId: string, targetType: string, targetId: string): Promise<void>;
  getCollectionFonts(collectionId: string, limit: number, offset: number): Promise<{ items: string[], total: number }>;

  getFavorites(): Promise<Favorite[]>;
  toggleFavorite(favorite: InsertFavorite): Promise<{ favorite?: Favorite, isFavorite: boolean }>;

  createFontFile(file: InsertFontFile): Promise<FontFile>;
  getFontFileByPath(fullPath: string): Promise<FontFile | undefined>;
  getFontFileByUrlKey(urlKey: string): Promise<FontFile | undefined>;
  createFontFace(face: InsertFontFace): Promise<FontFace>;
  
  searchFonts(params: any): Promise<{ items: any[], total: number }>;
  getFontFamily(family: string): Promise<any | undefined>;
  deleteFontFile(id: string): Promise<void>;
  deleteFontFileByPath(fullPath: string): Promise<void>;
}

export class JsonStorage implements IStorage {
  private categories: Category[] = [];
  private collections: Collection[] = [];
  private fontFiles: FontFile[] = [];
  private fontFaces: FontFace[] = [];
  private favorites: Favorite[] = [];
  private collectionItems: CollectionItem[] = [];

  constructor() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    this.load();
  }

  private load() {
    this.categories = this.readJson(CATEGORIES_FILE, []);
    this.collections = this.readJson(COLLECTIONS_FILE, []);
    this.fontFiles = this.readJson(FONT_FILES_FILE, []);
    this.fontFaces = this.readJson(FONT_FACES_FILE, []);
    this.favorites = this.readJson(FAVORITES_FILE, []);
    this.collectionItems = this.readJson(COLLECTION_ITEMS_FILE, []);
  }

  private readJson(file: string, fallback: any) {
    if (!fs.existsSync(file)) return fallback;
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      return fallback;
    }
  }

  private save() {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(this.categories, null, 2));
    fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(this.collections, null, 2));
    fs.writeFileSync(FONT_FILES_FILE, JSON.stringify(this.fontFiles, null, 2));
    fs.writeFileSync(FONT_FACES_FILE, JSON.stringify(this.fontFaces, null, 2));
    fs.writeFileSync(FAVORITES_FILE, JSON.stringify(this.favorites, null, 2));
    fs.writeFileSync(COLLECTION_ITEMS_FILE, JSON.stringify(this.collectionItems, null, 2));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return [...this.categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const created: Category = { ...category, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    this.categories.push(created);
    this.save();
    return created;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Not found");
    this.categories[idx] = { ...this.categories[idx], ...updates, updatedAt: new Date() };
    this.save();
    return this.categories[idx];
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories = this.categories.filter(c => c.id !== id);
    this.fontFiles = this.fontFiles.filter(f => f.categoryId !== id);
    this.save();
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.find(c => c.id === id);
  }

  // Collections
  async getCollections(): Promise<(Collection & { count: number })[]> {
    return this.collections.map(c => ({
      ...c,
      count: this.collectionItems.filter(i => i.collectionId === c.id).length
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const created: Collection = { ...collection, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    this.collections.push(created);
    this.save();
    return created;
  }

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const idx = this.collections.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Not found");
    this.collections[idx] = { ...this.collections[idx], ...updates, updatedAt: new Date() };
    this.save();
    return this.collections[idx];
  }

  async deleteCollection(id: string): Promise<void> {
    this.collections = this.collections.filter(c => c.id !== id);
    this.collectionItems = this.collectionItems.filter(i => i.collectionId !== id);
    this.save();
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    return this.collections.find(c => c.id === id);
  }

  // Collection Items
  async addCollectionItem(item: InsertCollectionItem): Promise<CollectionItem> {
    const existing = this.collectionItems.find(i => 
      i.collectionId === item.collectionId && 
      i.targetType === item.targetType && 
      i.targetId === item.targetId
    );
    if (existing) return existing;
    const created: CollectionItem = { ...item, id: crypto.randomUUID(), createdAt: new Date() };
    this.collectionItems.push(created);
    this.save();
    return created;
  }

  async removeCollectionItem(collectionId: string, targetType: string, targetId: string): Promise<void> {
    this.collectionItems = this.collectionItems.filter(i => 
      !(i.collectionId === collectionId && i.targetType === targetType && i.targetId === targetId)
    );
    this.save();
  }

  async getCollectionFonts(collectionId: string, limit: number, offset: number): Promise<{ items: string[], total: number }> {
    const items = this.collectionItems
      .filter(i => i.collectionId === collectionId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    return {
      items: items.slice(offset, offset + limit).map(i => i.targetId),
      total: items.length
    };
  }

  // Favorites
  async getFavorites(): Promise<Favorite[]> {
    return [...this.favorites].sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async toggleFavorite(favorite: InsertFavorite): Promise<{ favorite?: Favorite, isFavorite: boolean }> {
    const idx = this.favorites.findIndex(f => 
      f.targetType === favorite.targetType && f.targetId === favorite.targetId
    );
    if (idx !== -1) {
      this.favorites.splice(idx, 1);
      this.save();
      return { isFavorite: false };
    } else {
      const created: Favorite = { ...favorite, id: crypto.randomUUID(), createdAt: new Date() };
      this.favorites.push(created);
      this.save();
      return { favorite: created, isFavorite: true };
    }
  }

  // Fonts
  async createFontFile(file: InsertFontFile): Promise<FontFile> {
    const created: FontFile = { ...file, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
    this.fontFiles.push(created);
    this.save();
    return created;
  }

  async getFontFileByPath(fullPath: string): Promise<FontFile | undefined> {
    return this.fontFiles.find(f => f.fullPath === fullPath);
  }

  async getFontFileByUrlKey(urlKey: string): Promise<FontFile | undefined> {
    return this.fontFiles.find(f => f.urlKey === urlKey);
  }

  async createFontFace(face: InsertFontFace): Promise<FontFace> {
    const created: FontFace = { ...face, id: crypto.randomUUID(), createdAt: new Date() };
    this.fontFaces.push(created);
    this.save();
    return created;
  }

  async deleteFontFile(id: string): Promise<void> {
    this.fontFiles = this.fontFiles.filter(f => f.id !== id);
    this.fontFaces = this.fontFaces.filter(f => f.fontFileId !== id);
    this.save();
  }

  async deleteFontFileByPath(fullPath: string): Promise<void> {
    const file = this.fontFiles.find(f => f.fullPath === fullPath);
    if (file) await this.deleteFontFile(file.id);
  }

  async searchFonts(params: any): Promise<{ items: any[], total: number }> {
    let results = this.fontFaces.map(face => ({
      face,
      file: this.fontFiles.find(f => f.id === face.fontFileId)!
    })).filter(r => r.file);

    if (params.q) {
      const q = params.q.toLowerCase();
      results = results.filter(r => 
        r.face.family.toLowerCase().includes(q) || 
        r.face.subfamily.toLowerCase().includes(q) || 
        r.file.filename.toLowerCase().includes(q)
      );
    }

    if (params.categoryId) {
      results = results.filter(r => r.file.categoryId === params.categoryId);
    }

    if (params.favorites) {
      const favFamilies = new Set(this.favorites.filter(f => f.targetType === 'family').map(f => f.targetId));
      results = results.filter(r => favFamilies.has(r.face.family));
    }

    if (params.collectionId) {
      const colFamilies = new Set(this.collectionItems.filter(i => i.collectionId === params.collectionId && i.targetType === 'family').map(i => i.targetId));
      results = results.filter(r => colFamilies.has(r.face.family));
    }

    const grouped = new Map<string, any[]>();
    for (const { face, file } of results) {
      if (!grouped.has(face.family)) grouped.set(face.family, []);
      grouped.get(face.family)!.push({ ...face, file });
    }

    let families = Array.from(grouped.entries()).map(([family, faces]) => ({ family, faces }));
    
    if (params.sort === 'name_asc') {
      families.sort((a, b) => a.family.localeCompare(b.family));
    } else {
      families.sort((a, b) => {
        const dateA = Math.max(...a.faces.map(f => f.createdAt?.getTime() || 0));
        const dateB = Math.max(...b.faces.map(f => f.createdAt?.getTime() || 0));
        return dateB - dateA;
      });
    }

    return {
      items: families.slice(params.offset, params.offset + params.limit),
      total: families.length
    };
  }

  async getFontFamily(family: string): Promise<any | undefined> {
    const faces = this.fontFaces
      .filter(f => f.family === family)
      .map(face => ({ ...face, file: this.fontFiles.find(f => f.id === face.fontFileId)! }))
      .filter(r => r.file);

    if (faces.length === 0) return undefined;

    const collections = this.collectionItems
      .filter(i => i.targetType === 'family' && i.targetId === family)
      .map(i => i.collectionId);

    return { family, faces, collections };
  }
}

export const storage = new JsonStorage();
