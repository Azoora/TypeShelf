import { storage } from "./storage";
import { categories, collections } from "@shared/schema";
import { db } from "./db";
import * as fs from "fs";
import * as path from "path";

export async function seed() {
  // Create default fonts directory
  const fontsDir = path.resolve("fonts");
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir);
    console.log("Created ./fonts directory");
  }

  // Check categories
  const cats = await storage.getCategories();
  if (cats.length === 0) {
    await storage.createCategory({
      name: "Local Fonts",
      path: fontsDir,
      status: "ok",
      lastError: null
    });
    console.log("Seeded 'Local Fonts' category");
  }

  // Check collections
  const cols = await storage.getCollections();
  if (cols.length === 0) {
    await storage.createCollection({
      name: "My Projects",
      description: "Fonts for upcoming work",
      color: "#3b82f6" // blue-500
    });
    console.log("Seeded 'My Projects' collection");
  }
}
