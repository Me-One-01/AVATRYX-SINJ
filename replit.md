# AVATRYX - replit.md

## Overview

AVATRYX ("Create. Pose. Transform.") is a web platform for creating, editing, and downloading 3D human avatars. Users can upload images or videos, generate 3D human meshes (via HybrIK or PIFuHD pipelines), edit poses with preset or manual bone controls, swap outfits, add 3D objects to scenes, and interactively view everything in the browser using Three.js. Final assets can be downloaded in OBJ, GLB, or FBX formats.

The application follows a monorepo structure with a React frontend (Vite), an Express backend, and a shared schema layer. Currently uses in-memory storage but is configured for PostgreSQL via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite + TypeScript)
- `server/` — Express backend (TypeScript, run via tsx)
- `shared/` — Shared types and Zod schemas used by both client and server
- `migrations/` — Drizzle ORM migration output directory
- `uploads/` — Runtime directory for uploaded mesh files
- `attached_assets/` — Reference documents and design specs
- `script/` — Build tooling (esbuild for server, Vite for client)

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **3D Rendering**: Three.js with OrbitControls, OBJLoader, and GLTFLoader for interactive 3D avatar viewing (`client/src/components/three-viewer.tsx`)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming; dark theme by default with glassmorphism aesthetics; custom color system using HSL variables
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Pages
- `/` — Landing page with product overview and feature highlights
- `/build` — Multi-step avatar creation wizard (select mesh type, upload source, process)
- `/viewer/:id` — Interactive 3D viewer with pose editing, outfit swapping, and object management

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Style**: RESTful JSON API under `/api/` prefix
- **File Uploads**: Multer with disk storage to `uploads/meshes/`, 50MB limit
- **Static Files**: Uploaded files served from `/uploads/` path
- **Dev Server**: Vite dev server middleware with HMR in development
- **Production**: Static files served from `dist/public/`
- **Logging**: Custom request logger for API routes with timing

### Key API Endpoints
- `POST /api/avatar` — Create a new avatar (specify meshType: hybrik | pifuhd)
- `POST /api/avatar/:id/upload-mesh` — Upload a mesh file for an avatar
- `GET /api/avatar/:id` — Retrieve avatar state
- Pose update, outfit update, and object addition endpoints (defined in routes.ts)

### Data Layer
- **Current Storage**: In-memory (`MemStorage` class in `server/storage.ts`) using a `Map<string, AvatarState>`
- **Schema Definition**: Zod schemas in `shared/schema.ts` define avatar state, poses, objects, and API input validation
- **Database Config**: Drizzle ORM configured for PostgreSQL (`drizzle.config.ts`) with `DATABASE_URL` environment variable. The schema file is `shared/schema.ts`. Run `npm run db:push` to sync schema to database.
- **Note**: The Drizzle/PostgreSQL integration is set up but the current storage implementation is in-memory. When adding persistent storage, use Drizzle ORM with the PostgreSQL database provisioned by Replit.

### Shared Schema (`shared/schema.ts`)
- `avatarStateSchema` — Full avatar state (mesh info, rig, pose, appearance, objects)
- `avatarPoseSchema` — Pose data (preset or manual bone rotations)
- `avatarObjectSchema` — 3D objects attached to avatar (position, rotation, scale)
- `createAvatarSchema`, `updatePoseSchema`, `updateOutfitSchema`, `addObjectSchema` — API input validation schemas
- Exports constants: `POSE_PRESETS`, `OUTFIT_OPTIONS`

### Build System
- **Dev**: `npm run dev` — runs tsx on `server/index.ts`, Vite middleware serves frontend with HMR
- **Build**: `npm run build` — Vite builds client to `dist/public/`, esbuild bundles server to `dist/index.cjs`
- **Start**: `npm start` — runs production build from `dist/index.cjs`
- **Type Check**: `npm run check` — TypeScript type checking
- **DB Push**: `npm run db:push` — Drizzle Kit pushes schema to PostgreSQL

## External Dependencies

### Core Libraries
- **Three.js** — 3D rendering engine with OrbitControls, OBJLoader, GLTFLoader
- **Express** — HTTP server framework
- **Drizzle ORM** + **drizzle-kit** — Database ORM and migration tool (PostgreSQL dialect)
- **Zod** + **drizzle-zod** — Schema validation and type inference
- **Multer** — Multipart file upload handling
- **TanStack React Query** — Async state management for API calls

### UI Libraries
- **shadcn/ui** — Component library (new-york style variant)
- **Radix UI** — Headless UI primitives (dialog, tabs, slider, toast, select, etc.)
- **Tailwind CSS** — Utility-first CSS framework
- **class-variance-authority** — Variant-based component styling
- **Lucide React** — Icon library
- **Wouter** — Lightweight React router

### Database
- **PostgreSQL** — Primary database (requires `DATABASE_URL` environment variable)
- **connect-pg-simple** — PostgreSQL session store (available but not currently wired up)

### Build Tools
- **Vite** — Frontend bundler with React plugin and HMR
- **esbuild** — Server bundler for production builds
- **tsx** — TypeScript execution for development
- **PostCSS** + **Autoprefixer** — CSS processing

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay in dev
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)