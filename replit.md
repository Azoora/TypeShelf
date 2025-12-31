# TypeShelf - Self-Hosted Font Manager

## Overview

TypeShelf is a self-hosted font library browser web application designed for managing local font collections. It provides a modern interface for browsing, organizing, and previewing fonts stored in local directories. The app features categories (folder-based), favorites, collections/projects, search with filters, and detailed font previews with code snippets for various platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS variables for theming (dark mode default)
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Design Pattern**: Component-based architecture with custom hooks for data fetching

Key frontend directories:
- `client/src/pages/` - Route-level page components (Home, FontDetail, Settings)
- `client/src/components/` - Reusable UI components including Sidebar and FontCard
- `client/src/hooks/` - Custom React hooks for API interactions (use-fonts, use-categories, use-collections)
- `client/src/components/ui/` - shadcn/ui base components

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful API with typed routes defined in `shared/routes.ts`
- **Font Processing**: Uses `fontkit` library for extracting font metadata
- **File Watching**: Chokidar for real-time filesystem monitoring
- **Database**: PostgreSQL with Drizzle ORM (schema in `shared/schema.ts`)

Key backend files:
- `server/routes.ts` - API endpoint definitions
- `server/scanner.ts` - Font file scanning and metadata extraction
- `server/storage.ts` - Data access layer interface
- `server/seed.ts` - Initial data seeding

### Shared Code
- `shared/schema.ts` - Drizzle database schema defining tables for categories, collections, font_files, font_faces, favorites, and collection_items
- `shared/routes.ts` - API route definitions with Zod validation schemas

### Data Model
The application manages:
- **Categories**: Mapped to filesystem directories containing fonts
- **Collections**: User-created groupings of fonts
- **Font Files**: Physical font files with metadata (path, hash, size)
- **Font Faces**: Individual typefaces within font files (family, weight, style)
- **Favorites**: User-marked favorite fonts
- **Collection Items**: Links between collections and font families

### Build System
- Development: Vite dev server with HMR, proxied through Express
- Production: Vite builds to `dist/public`, server bundled with esbuild to `dist/index.cjs`
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Font Processing
- **fontkit**: Library for parsing font files and extracting metadata (family, weight, style, glyphs)

### File System
- **chokidar**: File system watcher for detecting font file changes in real-time

### UI Framework Dependencies
- **Radix UI**: Accessible, unstyled UI primitives (dialogs, dropdowns, tabs, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type checking across frontend and backend
- **Drizzle Kit**: Database migration tooling