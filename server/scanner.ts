import { storage } from "./storage";
import { InsertFontFile, InsertFontFace } from "@shared/schema";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import * as fontkit from "fontkit";
import { v4 as uuidv4 } from "uuid";

// Fontkit types are tricky, using any for now
type FontKitFont = any; 

export class Scanner {
  private isScanning = false;

  async scanAll() {
    if (this.isScanning) return;
    this.isScanning = true;
    console.log("Starting full scan...");
    try {
      const categories = await storage.getCategories();
      for (const cat of categories) {
        if (cat.status === 'ok') {
            await this.scanCategory(cat.id, cat.path);
        }
      }
    } finally {
      this.isScanning = false;
      console.log("Scan complete.");
    }
  }

  async scanCategory(categoryId: string, dirPath: string) {
    // Recursive scan
    // For MVP: Sync recursion or use glob. Let's use fs.readdir recursive
    if (!fs.existsSync(dirPath)) {
        await storage.updateCategory(categoryId, { status: 'missing', lastError: 'Path not found' });
        return;
    }
    
    await storage.updateCategory(categoryId, { status: 'ok', lastError: null });

    const files = this.getFilesRecursively(dirPath);
    for (const file of files) {
        await this.processFile(file, categoryId, dirPath);
    }
  }

  getFilesRecursively(dir: string): string[] {
    let results: string[] = [];
    try {
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) { 
                results = results.concat(this.getFilesRecursively(file));
            } else { 
                results.push(file);
            }
        });
    } catch (e) {
        console.error("Error scanning dir", dir, e);
    }
    return results;
  }

  async processFile(fullPath: string, categoryId: string, rootPath: string) {
    const ext = path.extname(fullPath).toLowerCase().replace('.', '');
    if (!['ttf', 'otf', 'woff', 'woff2', 'ttc'].includes(ext)) return;

    // Check if exists
    const existing = await storage.getFontFileByPath(fullPath);
    const stat = fs.statSync(fullPath);
    
    // Optimize: if mtime and size match, skip parsing
    if (existing && existing.sizeBytes === stat.size && existing.mtimeMs === stat.mtimeMs) {
        return; 
    }

    try {
        const buffer = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha1').update(buffer).digest('hex');
        
        // Fontkit parsing
        let fonts: FontKitFont[] = [];
        try {
            // For WOFF2 fontkit might need special handling or external decompressor depending on version, 
            // but standard fontkit usually handles it.
            // .openSync supports collection (ttc)
            const f = fontkit.openSync(fullPath);
            if (f.fonts) {
                fonts = f.fonts; // Collection
            } else {
                fonts = [f];
            }
        } catch (e) {
            console.error("Failed to parse font", fullPath, e);
            return;
        }

        // Create File Record
        // If updating, we might want to delete old faces first? For simplicity, we just create new or update.
        // Actually storage doesn't have updateFontFile. Let's delete and recreate if exists to be safe and clean old faces.
        if (existing) {
            await storage.deleteFontFile(existing.id);
        }

        const urlKey = hash.substring(0, 12) + '-' + path.basename(fullPath).replace(/[^a-zA-Z0-9.-]/g, '_');

        const fontFile: InsertFontFile = {
            categoryId,
            fullPath,
            relPath: path.relative(rootPath, fullPath),
            filename: path.basename(fullPath),
            ext,
            sizeBytes: stat.size,
            mtimeMs: stat.mtimeMs,
            sha1: hash,
            urlKey: urlKey
            // duplicateGroupKey: TODO check other files with same hash
        };

        const createdFile = await storage.createFontFile(fontFile);

        // Create Faces
        for (const f of fonts) {
            const face: InsertFontFace = {
                fontFileId: createdFile.id,
                family: f.familyName,
                subfamily: f.subfamilyName,
                postscriptName: f.postscriptName,
                weight: f['usWeightClass'] || 400,
                italic: f['italicAngle'] !== 0,
                stretch: f['usWidthClass']?.toString(),
                version: f.version ? String(f.version) : undefined,
                fullName: f.fullName
            };
            await storage.createFontFace(face);
        }

    } catch (err) {
        console.error("Error processing file", fullPath, err);
    }
  }
}

export const scanner = new Scanner();
