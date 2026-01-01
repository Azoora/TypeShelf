import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scanner } from "./scanner";
import { z } from "zod";
import * as chokidar from "chokidar";
import * as fs from "fs";
import { seed } from "./seed";
import { insertCategorySchema, insertCollectionSchema, insertCollectionItemSchema, insertFavoriteSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed data
  await seed();
  
  // === Categories ===
  app.get("/api/categories", async (req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const input = insertCategorySchema.parse(req.body);
      const cat = await storage.createCategory(input);
      scanner.scanCategory(cat.id, cat.path); 
      res.status(201).json(cat);
    } catch (err) {
       res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    await storage.deleteCategory(req.params.id);
    res.status(204).send();
  });

  // === Collections ===
  app.get("/api/collections", async (req, res) => {
    const cols = await storage.getCollections();
    res.json(cols);
  });

  app.post("/api/collections", async (req, res) => {
    const input = insertCollectionSchema.parse(req.body);
    const col = await storage.createCollection(input);
    res.status(201).json(col);
  });
  
  app.delete("/api/collections/:id", async (req, res) => {
    await storage.deleteCollection(req.params.id);
    res.status(204).send();
  });

  app.get("/api/collections/:id/fonts", async (req, res) => {
    const { page, pageSize } = req.query as any;
    const result = await storage.getCollectionFonts(req.params.id, Number(pageSize || 50), (Number(page || 1) - 1) * Number(pageSize || 50));
    res.json(result);
  });

  app.post("/api/collections/:id/fonts", async (req, res) => {
    const input = insertCollectionItemSchema.parse(req.body);
    const item = await storage.addCollectionItem({ ...input, collectionId: req.params.id });
    res.status(201).json(item);
  });
  
  app.delete("/api/collections/:id/fonts/:targetId", async (req, res) => {
    const { targetId } = req.params;
    const { targetType } = req.query as { targetType: string };
    await storage.removeCollectionItem(req.params.id, targetType || 'family', targetId);
    res.status(204).send();
  });

  // === Favorites ===
  app.get("/api/favorites", async (req, res) => {
    const favs = await storage.getFavorites();
    res.json(favs);
  });
  
  app.post("/api/favorites/toggle", async (req, res) => {
    const input = insertFavoriteSchema.parse(req.body);
    const result = await storage.toggleFavorite(input);
    res.json(result);
  });

  // === Fonts ===
  app.get("/api/fonts", async (req, res) => {
    const q = req.query;
    const result = await storage.searchFonts({
        q: q.q as string,
        categoryId: q.categoryId as string,
        collectionId: q.collectionId as string,
        favorites: q.favorites === 'true',
        types: q.types ? (q.types as string).split(',') : undefined,
        italic: q.italic === 'true',
        weightMin: q.weightMin ? Number(q.weightMin) : undefined,
        weightMax: q.weightMax ? Number(q.weightMax) : undefined,
        sort: q.sort as string,
        limit: Number(q.pageSize || 50),
        offset: (Number(q.page || 1) - 1) * Number(q.pageSize || 50)
    });
    res.json(result);
  });

  app.get("/api/fonts/:family", async (req, res) => {
    const result = await storage.getFontFamily(req.params.family);
    if (!result) return res.status(404).json({ message: "Not found" });
    res.json(result);
  });

  app.post("/api/rescan", async (req, res) => {
    scanner.scanAll(); 
    res.json({ message: "Scan started" });
  });

  // === Static Serving ===
  app.get('/fonts-static/:urlKey/:filename', async (req, res) => {
    const file = await storage.getFontFileByUrlKey(req.params.urlKey);
    if (!file) return res.status(404).send("Not found");
    
    if (fs.existsSync(file.fullPath)) {
        res.sendFile(file.fullPath);
    } else {
        res.status(404).send("File missing on disk");
    }
  });

  // Start Scanner
  scanner.scanAll();

  // Watcher Setup
  const categories = await storage.getCategories();
  const paths = categories.filter(c => c.status === 'ok').map(c => c.path);
  if (paths.length > 0) {
      const watcher = chokidar.watch(paths, { ignored: /(^|[\/\\])\../, persistent: true });
      watcher.on('add', path => {
          const cat = categories.find(c => path.startsWith(c.path));
          if (cat) scanner.processFile(path, cat.id, cat.path);
      });
      watcher.on('change', path => {
          const cat = categories.find(c => path.startsWith(c.path));
          if (cat) scanner.processFile(path, cat.id, cat.path);
      });
      watcher.on('unlink', async path => {
          await storage.deleteFontFileByPath(path);
      });
  }

  return httpServer;
}
