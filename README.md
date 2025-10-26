# Design Editor Backend

A real-time collaborative canvas-based design editor backend built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Live Demo

**Production API:** https://design-editor-backend-production.up.railway.app

**Health Check:** https://design-editor-backend-production.up.railway.app/api/health

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## ✨ Features

- ✅ **RESTful API** for designs, users, and comments
- ✅ **Real-time collaboration** via Socket.io (multi-user editing)
- ✅ **MongoDB persistence** with Mongoose ODM
- ✅ **Comments with @mentions** support
- ✅ **Pagination** for efficient data loading
- ✅ **Performance optimized** with database indexes and lean queries
- ✅ **CORS enabled** for cross-origin requests
- ✅ **Structured error handling** with error codes
- ✅ **WebSocket support** for live updates

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express.js | 5.1.0 | Web framework |
| MongoDB | Atlas | Database |
| Mongoose | 8.19.2 | ODM for MongoDB |
| Socket.io | 4.8.1 | Real-time WebSocket communication |
| dotenv | 17.2.3 | Environment variable management |
| CORS | 2.8.5 | Cross-origin resource sharing |

---

## 📦 Prerequisites

Before running this project locally, make sure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB Atlas account** (free tier) - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

---

## 🔧 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/prafulkoppalkar/design-editor-backend.git
cd design-editor-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you don't have one)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (it looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual credentials
6. Add your database name after `.net/`: 
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/design-editor?retryWrites=true&w=majority
   ```

### 4. Create Environment File

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following variables (see [Environment Variables](#environment-variables) section):

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string_here
NODE_ENV=development
```

**Example:**
```env
PORT=3000
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/design-editor?retryWrites=true&w=majority
NODE_ENV=development
```

⚠️ **Important:** Make sure to URL-encode special characters in your password!

**Special characters that need encoding:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`

**Example:** If your password is `Pass@123#`, use `Pass%40123%23`

---

## 🌍 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (optional, defaults to 3000) | `3000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `NODE_ENV` | Environment (development/production) | `development` |

---

## ▶️ Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make changes.

### Production Mode

```bash
npm start
```

### Expected Output

```
Server running on port 3000
MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
Database Name: design-editor
Mongoose connected to MongoDB
Socket.io initialized
```

---

## 🧪 Testing

### Test the API

Once the server is running, you can test the endpoints:

#### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

#### 2. Get All Designs
```bash
curl http://localhost:3000/api/designs
```

#### 3. Create a Design
```bash
curl -X POST http://localhost:3000/api/designs/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Design",
    "width": 1080,
    "height": 1080,
    "canvasBackground": "#ffffff"
  }'
```

#### 4. Get All Users
```bash
curl http://localhost:3000/api/users
```

### Test Socket.io Connection

Create a simple HTML file (`test-socket.html`):

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.io Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.io Connection Test</h1>
  <div id="status">Connecting...</div>
  
  <script>
    const socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
      document.getElementById('status').innerHTML = '✅ Connected! Socket ID: ' + socket.id;
      console.log('Connected:', socket.id);
      
      // Test joining a design room
      socket.emit('design:join', {
        designId: 'test-design-123',
        clientId: 'test-client-' + Math.random()
      });
    });
    
    socket.on('design:user-joined', (data) => {
      console.log('User joined:', data);
    });
    
    socket.on('disconnect', () => {
      document.getElementById('status').innerHTML = '❌ Disconnected';
    });
  </script>
</body>
</html>
```

Open this file in your browser to test the WebSocket connection.

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000
```

### REST Endpoints

#### Designs
```
GET    /api/designs              # List all designs (paginated)
GET    /api/designs/:id          # Get single design
POST   /api/designs/create       # Create new design
PUT    /api/designs/:id          # Update design
DELETE /api/designs/:id          # Delete design
```

#### Users
```
GET    /api/users                # List all users
GET    /api/users/:id            # Get single user
POST   /api/users/create         # Create new user
GET    /api/users/search?q=name  # Search users (for @mentions)
```

#### Comments
```
GET    /api/comments/design/:designId  # Get comments for design
POST   /api/comments/create            # Create comment
DELETE /api/comments/:id               # Delete comment
```

#### Health
```
GET    /api/health               # Health check
GET    /api/health/db            # Database health check
```

### Socket.io Events

**Client → Server:**
- `design:join` - Join a design room
- `design:leave` - Leave a design room
- `design:update` - Update design properties
- `design:element-add` - Add element to canvas
- `design:element-update` - Update element
- `design:element-delete` - Delete element
- `design:background-change` - Change canvas background
- `design:resize` - Resize canvas
- `design:name-change` - Change design name

**Server → Client:**
- `design:user-joined` - User joined the room
- `design:user-left` - User left the room
- `design:update-received` - Design updated
- `design:element-added` - Element added
- `design:element-updated` - Element updated
- `design:element-deleted` - Element deleted
- `design:background-changed` - Background changed
- `design:resized` - Canvas resized
- `design:name-changed` - Name changed
- `error` - Error occurred

For detailed API documentation, see [DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md)

---

## 🚀 Deployment

This project is deployed on **Railway** (supports WebSocket).

### Deploy to Railway

1. **Sign up at [Railway](https://railway.app/)**

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository

3. **Add Environment Variables:**
   - Go to "Variables" tab
   - Add `MONGODB_URI` (your MongoDB Atlas connection string)
   - Add `NODE_ENV=production`

4. **Generate Domain:**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Your API will be live at `https://your-app.up.railway.app`

### Why Not Vercel?

❌ Vercel uses serverless functions which don't support persistent WebSocket connections required by Socket.io.

✅ Use Railway, Render, or Heroku instead.

---

## 📁 Project Structure

```
design-editor-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── Design.js            # Design schema
│   │   ├── User.js              # User schema
│   │   └── Comment.js           # Comment schema
│   ├── routes/
│   │   ├── designRoutes.js      # Design endpoints
│   │   ├── userRoutes.js        # User endpoints
│   │   ├── commentRoutes.js     # Comment endpoints
│   │   └── healthRoutes.js      # Health check
│   ├── socket/
│   │   ├── socketHandler.js     # Socket.io events
│   │   ├── designSync.js        # Real-time sync logic
│   │   └── roomManager.js       # Room management
│   └── server.js                # Express & Socket.io setup
├── .env                         # Environment variables (create this)
├── .gitignore
├── package.json
├── README.md                    # This file
└── DESIGN_DOCUMENT.md           # Architecture documentation
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongooseServerSelectionError: Could not connect to any servers`

**Solutions:**
1. Check your MongoDB Atlas connection string
2. Make sure your IP is whitelisted in MongoDB Atlas (Network Access)
3. Verify your username and password are correct
4. Ensure special characters in password are URL-encoded

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5000 npm run dev
```

### Socket.io Connection Failed

**Error:** `WebSocket connection failed`

**Solutions:**
1. Make sure the server is running
2. Check CORS configuration in `src/server.js`
3. Verify the Socket.io client URL matches your server URL

---

## 📚 Additional Documentation

- **Architecture & Design Decisions:** [DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md)
- **Database Schema:** See DESIGN_DOCUMENT.md → Database Schema Design
- **API Contract:** See DESIGN_DOCUMENT.md → API Documentation

---

## 👨‍💻 Author

Built as part of a 48-hour coding assignment for a canvas-based design editor.

---

## 📄 License

ISC

---

**Happy Coding! 🚀**

