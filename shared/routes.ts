import { z } from 'zod';
import { 
  insertCategorySchema, 
  insertCollectionSchema, 
  insertFavoriteSchema, 
  insertCollectionItemSchema,
  categories,
  collections,
  fontFiles,
  fontFaces,
  favorites,
  collectionItems
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Composite types for responses
export const fontFaceWithFileSchema = z.custom<typeof fontFaces.$inferSelect & { file: typeof fontFiles.$inferSelect }>();
export const fontFileWithFacesSchema = z.custom<typeof fontFiles.$inferSelect & { faces: typeof fontFaces.$inferSelect[] }>();
export const collectionWithCountSchema = z.custom<typeof collections.$inferSelect & { count: number }>();

export const api = {
  // === Categories ===
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories',
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/categories/:id',
      input: insertCategorySchema.partial(),
      responses: {
        200: z.custom<typeof categories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/categories/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    rescan: {
      method: 'POST' as const,
      path: '/api/categories/:id/rescan',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },

  // === Collections ===
  collections: {
    list: {
      method: 'GET' as const,
      path: '/api/collections',
      responses: {
        200: z.array(collectionWithCountSchema),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/collections',
      input: insertCollectionSchema,
      responses: {
        201: z.custom<typeof collections.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/collections/:id',
      input: insertCollectionSchema.partial(),
      responses: {
        200: z.custom<typeof collections.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/collections/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    fonts: {
      method: 'GET' as const,
      path: '/api/collections/:id/fonts',
      input: z.object({
        page: z.coerce.number().optional().default(1),
        pageSize: z.coerce.number().optional().default(50),
      }).optional(),
      responses: {
        200: z.object({
          items: z.array(z.string()), // List of Families
          total: z.number(),
        }),
      },
    },
    addFont: {
      method: 'POST' as const,
      path: '/api/collections/:id/items',
      input: insertCollectionItemSchema.omit({ collectionId: true }),
      responses: {
        201: z.custom<typeof collectionItems.$inferSelect>(),
      },
    },
    removeFont: {
      method: 'DELETE' as const,
      path: '/api/collections/:id/items',
      input: z.object({ targetType: z.string(), targetId: z.string() }), // Pass via query or body? Typically DELETE body is tricky, but we'll use query for simplicity or body if supported. Let's assume BODY for now, or we can make a specific route.
      // Better: DELETE /api/collections/:id/items?targetId=...
      responses: {
        204: z.void(),
      },
    },
  },

  // === Favorites ===
  favorites: {
    list: {
      method: 'GET' as const,
      path: '/api/favorites',
      responses: {
        200: z.array(z.custom<typeof favorites.$inferSelect>()),
      },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/favorites/toggle',
      input: insertFavoriteSchema,
      responses: {
        200: z.object({ favorite: z.custom<typeof favorites.$inferSelect>().optional(), isFavorite: z.boolean() }),
      },
    },
  },

  // === Fonts ===
  fonts: {
    list: {
      method: 'GET' as const,
      path: '/api/fonts',
      input: z.object({
        q: z.string().optional(),
        categoryId: z.string().optional(),
        collectionId: z.string().optional(),
        favorites: z.string().optional(), // 'true'
        types: z.string().optional(), // comma sep
        italic: z.string().optional(), // 'true'
        weightMin: z.coerce.number().optional(),
        weightMax: z.coerce.number().optional(),
        sort: z.string().optional(), // 'name_asc', 'date_desc'
        page: z.coerce.number().optional().default(1),
        pageSize: z.coerce.number().optional().default(50),
      }).optional(),
      responses: {
        200: z.object({
          items: z.array(z.object({
            family: z.string(),
            faces: z.array(fontFaceWithFileSchema),
            previewText: z.string().optional(),
          })),
          total: z.number(),
        }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/fonts/:family', // Get by Family Name
      responses: {
        200: z.object({
          family: z.string(),
          faces: z.array(fontFaceWithFileSchema),
          collections: z.array(z.string()), // IDs of collections this family is in
        }),
        404: errorSchemas.notFound,
      },
    },
    rescan: {
      method: 'POST' as const,
      path: '/api/rescan',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  
  // === System ===
  health: {
    check: {
      method: 'GET' as const,
      path: '/api/health',
      responses: {
        200: z.object({ status: z.string(), scanning: z.boolean() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
