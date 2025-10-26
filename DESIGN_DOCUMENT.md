# Design Editor Backend - Architecture & Design Document

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack & Decisions](#technology-stack--decisions)
4. [Database Schema Design](#database-schema-design)
5. [API Documentation](#api-documentation)
6. [Real-Time Architecture](#real-time-architecture)
7. [Performance Optimizations](#performance-optimizations)
8. [What Was Cut & Why](#what-was-cut--why)
9. [Future Improvements](#future-improvements)

---

## 🎯 Project Overview

**Goal:** Build a backend for a canvas-based design editor (Canva/Figma-lite) supporting:
- Multi-user real-time collaboration
- Design persistence in MongoDB
- Comments with @mentions
- RESTful API for CRUD operations
- WebSocket-based live updates

**Time Constraint:** 48 hours

**Live Deployment:** https://design-editor-backend-production.up.railway.app

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                  (Not part of this repo)                     │
└────────────────┬────────────────────────┬───────────────────┘
                 │                        │
                 │ REST API               │ WebSocket (Socket.io)
                 │                        │
┌────────────────▼────────────────────────▼───────────────────┐
│                    Express.js Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Socket.io   │  │  Middleware  │      │
│  │   Layer      │  │   Handlers   │  │   (CORS)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                 │
│  ┌──────▼──────────────────▼───────┐                        │
│  │      Business Logic Layer       │                        │
│  │  - Design Sync                  │                        │
│  │  - Room Management              │                        │
│  │  - Validation                   │                        │
│  └──────┬──────────────────────────┘                        │
│         │                                                    │
│  ┌──────▼──────────────────────────┐                        │
│  │     Mongoose ODM Layer          │                        │
│  │  - Models                       │                        │
│  │  - Schemas                      │                        │
│  │  - Validation                   │                        │
│  └──────┬──────────────────────────┘                        │
└─────────┼──────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────┐
│                    MongoDB Atlas                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Designs    │  │    Users     │  │   Comments   │     │
│  │  Collection  │  │  Collection  │  │  Collection  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
design-editor-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection setup
│   ├── models/
│   │   ├── Design.js            # Design schema & model
│   │   ├── User.js              # User schema & model
│   │   └── Comment.js           # Comment schema & model
│   ├── routes/
│   │   ├── designRoutes.js      # Design CRUD endpoints
│   │   ├── userRoutes.js        # User endpoints
│   │   ├── commentRoutes.js     # Comment endpoints
│   │   └── healthRoutes.js      # Health check endpoints
│   ├── socket/
│   │   ├── socketHandler.js     # Socket.io event handlers
│   │   ├── designSync.js        # Real-time design sync logic
│   │   └── roomManager.js       # Room management utilities
│   └── server.js                # Express app & Socket.io setup
├── package.json
└── .env                         # Environment variables
```

---

## 🛠️ Technology Stack & Decisions

### Core Technologies

| Technology | Version | Purpose | Why Chosen |
|------------|---------|---------|------------|
| **Node.js** | 18+ | Runtime | ✅ Non-blocking I/O for real-time<br>✅ Large ecosystem<br>✅ JavaScript full-stack |
| **Express.js** | 5.1.0 | Web Framework | ✅ Minimal & flexible<br>✅ Industry standard<br>✅ Easy middleware integration |
| **MongoDB** | Atlas | Database | ✅ Flexible schema for canvas elements<br>✅ JSON-like documents<br>✅ Horizontal scalability |
| **Mongoose** | 8.19.2 | ODM | ✅ Schema validation<br>✅ Middleware hooks<br>✅ Query builder |
| **Socket.io** | 4.8.1 | Real-time | ✅ WebSocket with fallbacks<br>✅ Room-based broadcasting<br>✅ Auto-reconnection |
| **Railway** | - | Hosting | ✅ WebSocket support<br>✅ Auto-deploy from GitHub<br>✅ Free tier |

### Pros & Cons Analysis

#### ✅ **Express.js**
**Pros:**
- Lightweight and fast
- Huge middleware ecosystem
- Easy to learn and use
- Great for RESTful APIs

**Cons:**
- No built-in structure (need to organize manually)
- Callback hell if not careful (mitigated with async/await)

#### ✅ **MongoDB + Mongoose**
**Pros:**
- Flexible schema perfect for canvas elements (different types: text, image, shape)
- Easy to store nested arrays (elements array)
- Mongoose provides validation and type safety
- Indexes for performance optimization

**Cons:**
- No ACID transactions across collections (not needed for this use case)
- Can grow large with many elements (mitigated with pagination and field selection)

#### ✅ **Socket.io**
**Pros:**
- Automatic reconnection
- Room-based architecture perfect for per-design collaboration
- Fallback to polling if WebSocket unavailable
- Built-in event system

**Cons:**
- Doesn't work on serverless platforms (Vercel)
- Requires persistent connections (solved with Railway)
- Memory usage for many concurrent connections

---

## 📊 Database Schema Design

### 1. Design Collection

**Purpose:** Store canvas designs with elements, dimensions, and metadata

```javascript
{
  _id: ObjectId,
  name: String,                    // Design name
  description: String,             // Optional description
  width: Number,                   // Canvas width (default: 1080)
  height: Number,                  // Canvas height (default: 1080)
  canvasBackground: String,        // Background color/gradient
  elements: [                      // Array of canvas elements
    {
      id: String,                  // Unique element ID
      type: String,                // 'text' | 'image' | 'rect' | 'circle'
      
      // Common properties
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      rotation: Number,
      zIndex: Number,
      
      // Type-specific properties
      // For text:
      text: String,
      fontSize: Number,
      fontFamily: String,
      fontWeight: String,
      color: String,
      textAlign: String,
      
      // For image:
      src: String,
      
      // For shapes:
      fill: String,
      stroke: String,
      strokeWidth: Number,
      
      // For circle:
      radius: Number
    }
  ],
  version: Number,                 // Incremented on each update
  lastModifiedAt: Date,            // For conflict resolution
  createdAt: Date,                 // Auto-generated
  updatedAt: Date                  // Auto-generated
}
```

**Indexes:**
```javascript
{ updatedAt: -1 }    // For sorting by recent
{ createdAt: -1 }    // For sorting by creation
{ name: 1 }          // For searching by name
```

### 2. User Collection

**Purpose:** Store user information for comments and @mentions

```javascript
{
  _id: ObjectId,
  name: String,                    // User's full name
  email: String,                   // Unique email (indexed)
  avatar: String,                  // Avatar URL (auto-generated via DiceBear)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ email: 1 }         // Unique index
{ name: 1 }          // For @mention search
```

### 3. Comment Collection

**Purpose:** Store comments on designs with @mention support

```javascript
{
  _id: ObjectId,
  designId: ObjectId,              // Reference to Design
  authorId: ObjectId,              // Reference to User
  text: String,                    // Comment text (max 2000 chars)
  mentions: [ObjectId],            // Array of mentioned user IDs
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
{ designId: 1 }                    // Single field index
{ authorId: 1 }                    // Single field index
{ designId: 1, createdAt: -1 }     // Compound index for pagination
{ authorId: 1, createdAt: -1 }     // Compound index for user's comments
```

### Schema Design Decisions

#### ✅ **Embedded vs Referenced**

**Elements Array (Embedded):**
- ✅ **Chosen:** Embedded in Design document
- **Why:** Elements are tightly coupled to design, always loaded together
- **Trade-off:** Can grow large, but mitigated by excluding from list queries

**Comments (Referenced):**
- ✅ **Chosen:** Separate collection with references
- **Why:** Comments can be paginated, filtered, and queried independently
- **Trade-off:** Requires population, but more flexible

**Users (Referenced):**
- ✅ **Chosen:** Separate collection
- **Why:** Users are shared across designs and comments
- **Trade-off:** Requires joins, but avoids duplication

---

## 📡 API Documentation

### Base URL
```
Production: https://design-editor-backend-production.up.railway.app
Local: http://localhost:3000
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "count": 10,
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

**Error Response:**
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional error details"
}
```

### REST API Endpoints

#### Health Check
```http
GET /api/health
```

#### Designs
```http
GET    /api/designs                    # List all designs (paginated)
GET    /api/designs/:id                # Get single design
POST   /api/designs/create             # Create new design
PUT    /api/designs/:id                # Update design
DELETE /api/designs/:id                # Delete design
```

#### Users
```http
GET    /api/users                      # List all users
GET    /api/users/:id                  # Get single user
POST   /api/users/create               # Create new user
GET    /api/users/search?q=name        # Search users (for @mentions)
```

#### Comments
```http
GET    /api/comments/design/:designId  # Get comments for design
POST   /api/comments/create            # Create comment
DELETE /api/comments/:id               # Delete comment
```

### Socket.io Events

#### Connection Events
```javascript
// Client → Server
socket.emit('design:join', { designId, clientId });
socket.emit('design:leave', { designId });

// Server → All Clients
socket.on('design:user-joined', { designId, activeUsers, timestamp });
socket.on('design:user-left', { designId, activeUsers, timestamp });
```

#### Design Update Events
```javascript
// Client → Server
socket.emit('design:update', { designId, clientId, timestamp, changes });
socket.emit('design:element-add', { designId, clientId, timestamp, element });
socket.emit('design:element-update', { designId, clientId, timestamp, elementId, updates });
socket.emit('design:element-delete', { designId, clientId, timestamp, elementId });
socket.emit('design:background-change', { designId, clientId, timestamp, canvasBackground });
socket.emit('design:resize', { designId, clientId, timestamp, width, height });
socket.emit('design:name-change', { designId, clientId, timestamp, name });

// Server → All Clients
socket.on('design:update-received', { designId, clientId, timestamp, changes });
socket.on('design:element-added', { designId, clientId, timestamp, element });
socket.on('design:element-updated', { designId, clientId, timestamp, elementId, updates });
socket.on('design:element-deleted', { designId, clientId, timestamp, elementId });
socket.on('design:background-changed', { designId, clientId, timestamp, canvasBackground });
socket.on('design:resized', { designId, clientId, timestamp, width, height });
socket.on('design:name-changed', { designId, clientId, timestamp, name });

// Error handling
socket.on('error', { event, message, designId, elementId });
```

---

## 🔄 Real-Time Architecture

### Room-Based Collaboration

Each design has its own Socket.io room: `design-${designId}`

```
┌─────────────────────────────────────────────────────────┐
│                    Socket.io Server                      │
│                                                          │
│  Room: design-123                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Client A  │  │  Client B  │  │  Client C  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  Room: design-456                                        │
│  ┌────────────┐  ┌────────────┐                         │
│  │  Client D  │  │  Client E  │                         │
│  └────────────┘  └────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

### Event Flow

```
User A adds element
    ↓
Client A: socket.emit('design:element-add', {...})
    ↓
Server:
  1. Validate design exists ✅
  2. Save to MongoDB ✅
  3. Increment version ✅
  4. Broadcast to room ✅
    ↓
Server: io.to('design-123').emit('design:element-added', {...})
    ↓
Client A: Receives own update (ignores via clientId check)
Client B: Receives update → Adds element to canvas ✅
Client C: Receives update → Adds element to canvas ✅
    ↓
All clients in sync! ✅
```

### Conflict Resolution Strategy

**Last-Write-Wins (LWW):**
- Each update includes a `timestamp`
- `version` field incremented on every change
- `lastModifiedAt` updated on every change
- Frontend can use timestamps to detect conflicts
- No operational transformation (OT) or CRDT (time constraint)

### Active User Tracking

- Tracked in-memory (not persisted to database)
- Incremented on `design:join`
- Decremented on `design:leave` and `disconnect`
- Broadcasted to all clients in room

---

## ⚡ Performance Optimizations

### 1. Database Indexes
```javascript
// Design collection
{ updatedAt: -1 }
{ createdAt: -1 }
{ name: 1 }

// User collection
{ email: 1 }  // Unique
{ name: 1 }

// Comment collection
{ designId: 1 }
{ authorId: 1 }
{ designId: 1, createdAt: -1 }  // Compound
```

### 2. Pagination
- Default: 50 designs per page
- Prevents loading thousands of designs
- Query params: `?page=1&limit=50`

### 3. Field Selection
- List view excludes `elements` array
- Reduces response size by 80-90%
- Single design view includes all fields

### 4. Lean Queries
```javascript
Design.find().lean()  // Returns plain JS objects (5-10x faster)
```

### 5. Socket.io Optimizations
- Room-based broadcasting (only to relevant clients)
- Client-side filtering (ignore own updates via `clientId`)
- Reusable event handler wrapper (DRY principle)

### Performance Results
- **Before optimization:** 30+ seconds timeout
- **After optimization:** 0.9 seconds ✅
- **Improvement:** 97% faster

---

## ❌ What Was Cut & Why

Due to the 48-hour time constraint, the following features were **intentionally cut** to focus on core functionality:

### 1. ❌ **Canvas Presets in Database**

**What was planned:**
- Store canvas presets (Instagram Post, Facebook Cover, YouTube Thumbnail, etc.) in MongoDB
- API endpoint: `GET /api/presets`
- Allow users to select from predefined sizes

**Why cut:**
- **Time constraint:** Would require additional model, routes, and seed data
- **Workaround:** Frontend can hardcode common presets
- **Priority:** Core design CRUD and real-time sync were more critical

**Impact:** Low - Frontend can easily implement this client-side

---

### 2. ❌ **Metadata APIs for Elements vs Styles**

**What was planned:**
- Separate APIs to get available element types and their styling options
- `GET /api/metadata/elements` → Returns available element types (text, image, rect, circle)
- `GET /api/metadata/styles/:elementType` → Returns available styles for each type

**Example response:**
```json
{
  "text": {
    "styles": ["fontSize", "fontFamily", "fontWeight", "color", "textAlign"],
    "defaults": {
      "fontSize": 16,
      "fontFamily": "Arial",
      "color": "#000000"
    }
  }
}
```

**Why cut:**
- **Time constraint:** Would require additional routes and data structures
- **Workaround:** Frontend can hardcode element types and styling options
- **Priority:** Real-time collaboration was more important

**Impact:** Low - This is more of a "nice-to-have" for dynamic UI generation

---

### 3. ❌ **Authentication & Authorization**

**What was planned:**
- JWT-based authentication
- User login/signup endpoints
- Protected routes (only owner can edit design)
- Per-user design filtering

**Why cut:**
- **Time constraint:** Auth adds significant complexity
- **Workaround:** All designs are public for now
- **Priority:** Core design editor functionality was the focus

**Impact:** Medium - Required for production, but not for demo

---

### 4. ❌ **Design Thumbnails**

**What was planned:**
- Server-side thumbnail generation using Puppeteer or Canvas
- Store thumbnail URL in Design model
- Display thumbnails in design list

**Why cut:**
- **Time constraint:** Requires additional dependencies and processing
- **Workaround:** Frontend can generate thumbnails client-side
- **Priority:** Core CRUD operations were more important

**Impact:** Low - Frontend can handle this

---

### 5. ❌ **Operational Transformation (OT) / CRDT**

**What was planned:**
- Proper conflict resolution for concurrent edits
- Operational Transformation or CRDT algorithms
- Handle simultaneous edits to same element

**Why cut:**
- **Time constraint:** OT/CRDT is complex and time-consuming
- **Workaround:** Last-Write-Wins with timestamps
- **Priority:** Basic real-time sync was sufficient for demo

**Impact:** Medium - Can cause conflicts in heavy concurrent editing

**Current approach:**
- Last-Write-Wins (LWW) strategy
- `version` field for optimistic locking
- `timestamp` for conflict detection
- Frontend can show warnings if version mismatch

---

### 6. ❌ **Undo/Redo History in Database**

**What was planned:**
- Store action history in MongoDB
- API endpoints for undo/redo
- Persist undo stack across sessions

**Why cut:**
- **Time constraint:** Requires complex state management
- **Workaround:** Frontend handles undo/redo in memory
- **Priority:** Real-time sync was more critical

**Impact:** Low - Frontend can implement this client-side

---

### 7. ❌ **Comprehensive Unit & E2E Tests**

**What was planned:**
- Jest unit tests for all routes and models
- Socket.io event tests
- E2E tests with Playwright
- CI/CD pipeline with GitHub Actions

**Why cut:**
- **Time constraint:** Testing takes significant time
- **Workaround:** Manual testing performed
- **Priority:** Core functionality over test coverage

**Impact:** High - Required for production, but not for demo

**What was tested manually:**
- ✅ All REST API endpoints
- ✅ Socket.io connection and events
- ✅ Multi-user collaboration (2 browser windows)
- ✅ Database persistence
- ✅ Error handling

---

### 8. ❌ **Rate Limiting & Security**

**What was planned:**
- Rate limiting on API endpoints
- Input sanitization
- XSS protection
- CSRF tokens

**Why cut:**
- **Time constraint:** Security hardening takes time
- **Workaround:** Basic validation with Mongoose
- **Priority:** Core functionality first

**Impact:** High - Required for production

**What was implemented:**
- ✅ CORS configuration
- ✅ Mongoose schema validation
- ✅ Error handling
- ❌ Rate limiting
- ❌ Advanced input sanitization

---

### 9. ❌ **Design Versioning & History**

**What was planned:**
- Store design history (snapshots)
- Ability to restore previous versions
- Version comparison

**Why cut:**
- **Time constraint:** Requires additional collections and logic
- **Workaround:** Single `version` field for conflict detection
- **Priority:** Real-time sync was more important

**Impact:** Medium - Nice-to-have for production

---

### 10. ❌ **Advanced Query Features**

**What was planned:**
- Search designs by name
- Filter by date range
- Sort by multiple fields
- Full-text search

**Why cut:**
- **Time constraint:** Would require additional indexes and query logic
- **Workaround:** Basic sorting by `updatedAt`
- **Priority:** Core CRUD was sufficient

**Impact:** Low - Can be added incrementally

---

## 🚀 Future Improvements

### High Priority (Production-Ready)

1. **Authentication & Authorization**
   - JWT-based auth
   - Protected routes
   - Per-user designs

2. **Comprehensive Testing**
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)
   - CI/CD pipeline

3. **Security Hardening**
   - Rate limiting
   - Input sanitization
   - XSS protection
   - CSRF tokens

4. **Better Conflict Resolution**
   - Operational Transformation (OT)
   - Or CRDT (Conflict-free Replicated Data Types)
   - Handle simultaneous edits gracefully

### Medium Priority (Enhanced Features)

5. **Canvas Presets API**
   - Store presets in database
   - CRUD operations for presets
   - Admin panel to manage presets

6. **Design Thumbnails**
   - Server-side thumbnail generation
   - Store in cloud storage (S3/Cloudinary)
   - Display in design list

7. **Metadata APIs**
   - Element types API
   - Styling options API
   - Dynamic UI generation

8. **Design Versioning**
   - Store design history
   - Restore previous versions
   - Version comparison

### Low Priority (Nice-to-Have)

9. **Advanced Search & Filtering**
   - Full-text search
   - Filter by date, size, tags
   - Sort by multiple fields

10. **Analytics & Monitoring**
    - Track design views
    - Monitor API performance
    - Error tracking (Sentry)

11. **Webhooks**
    - Notify external services on design updates
    - Integration with other tools

12. **Export Options**
    - PDF export
    - SVG export
    - Multiple image formats

---

## 📝 Summary

### What Was Built ✅

- ✅ RESTful API for designs, users, and comments
- ✅ Real-time multi-user collaboration via Socket.io
- ✅ MongoDB persistence with Mongoose ODM
- ✅ Comments with @mentions support
- ✅ Pagination and performance optimizations
- ✅ CORS configuration for cross-origin requests
- ✅ Error handling with structured responses
- ✅ Deployed to Railway with auto-deploy from GitHub

### What Was Cut ❌

- ❌ Canvas presets in database
- ❌ Metadata APIs for elements/styles
- ❌ Authentication & authorization
- ❌ Design thumbnails
- ❌ Operational Transformation / CRDT
- ❌ Undo/redo history in database
- ❌ Comprehensive unit & E2E tests
- ❌ Rate limiting & advanced security
- ❌ Design versioning & history
- ❌ Advanced query features

### Key Decisions

1. **Last-Write-Wins over OT/CRDT** - Simpler to implement, sufficient for demo
2. **Embedded elements over separate collection** - Elements are tightly coupled to designs
3. **Referenced comments over embedded** - Comments need independent querying
4. **Railway over Vercel** - WebSocket support required
5. **Pagination & field selection** - Performance optimization for large datasets

### Time Breakdown (48 hours)

- **Planning & Architecture:** 4 hours
- **Database schema & models:** 6 hours
- **REST API implementation:** 10 hours
- **Socket.io real-time sync:** 12 hours
- **Testing & debugging:** 8 hours
- **Deployment & optimization:** 6 hours
- **Documentation:** 2 hours

---

## 🔗 Links

- **Live API:** https://design-editor-backend-production.up.railway.app
- **GitHub:** https://github.com/prafulkoppalkar/design-editor-backend
- **Health Check:** https://design-editor-backend-production.up.railway.app/api/health

---

**Built with ❤️ in 48 hours**
