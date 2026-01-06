# SafeSpace Microservices Architecture

## Overview

SafeSpace has been architected with a microservices approach, featuring 3 core services that handle different aspects of the application:

1. **Auth Service** (Port 3002) - Authentication & Authorization
2. **Content Service** (Port 3004) - Posts, Comments, Hope Wall
3. **Media Service** (Port 3010) - Image Upload & Processing

All services communicate through the **API Gateway** (Port 3001) which routes requests to the appropriate microservice.

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │
│  (Port 3000)│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   API Gateway   │
│   (Port 3001)   │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ▼         ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│  Auth  │ │Content │ │ Media  │ │PostgreSQL│
│  3002  │ │  3004  │ │  3010  │ │   5432   │
└────────┘ └────────┘ └────────┘ └──────────┘
```

## Services

### 1. Auth Service (Port 3002)

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Session management
- Email verification
- Password reset
- Brute force protection

**Endpoints:**
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /verify-email` - Verify email address
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user
- `GET /validate` - Validate JWT token (for inter-service communication)
- `GET /health` - Health check

**Models:**
- User
- Session
- LoginAttempt
- VerificationToken

### 2. Content Service (Port 3004)

**Responsibilities:**
- Post creation, retrieval, update, deletion
- Comment management
- Reactions (likes, helpful, etc.)
- Hope Wall stories and quotes
- Content moderation integration

**Endpoints:**
- `GET /posts` - Get all posts (paginated)
- `GET /posts/:id` - Get single post
- `POST /posts` - Create new post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `GET /hope-wall/stories` - Get hope stories
- `POST /hope-wall/stories` - Create hope story
- `GET /hope-wall/quotes` - Get quotes
- `POST /hope-wall/quotes` - Create quote
- `GET /health` - Health check

**Models:**
- Post
- Comment
- Reaction
- HopeStory
- Quote
- PostRevision

### 3. Media Service (Port 3010)

**Responsibilities:**
- Image upload and storage
- Image processing (resize, compress)
- Thumbnail generation
- Media metadata management
- File deletion

**Endpoints:**
- `POST /upload` - Upload single image
- `POST /upload-multiple` - Upload multiple images
- `GET /:id` - Get media by ID
- `DELETE /:id` - Delete media
- `GET /uploads/*` - Serve static files
- `GET /health` - Health check

**Models:**
- PostMedia

**Features:**
- Automatic image resizing (max 1200x1200)
- Thumbnail generation (300x300)
- JPEG compression (85% quality)
- File type validation
- Size limits (10MB default)

## Running the Microservices

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Manual Setup (Development)

#### Prerequisites
- Node.js v20+
- PostgreSQL
- Redis (optional, for auth service)

#### 1. Install Dependencies

```bash
# Auth Service
cd services/auth-service
npm install

# Content Service
cd ../content-service
npm install

# Media Service
cd ../media-service
npm install

# API Gateway
cd ../../api-gateway
npm install
```

#### 2. Configure Environment Variables

Create `.env` files in each service directory based on `.env.example`:

```bash
# Copy example files
cp services/auth-service/.env.example services/auth-service/.env
cp services/content-service/.env.example services/content-service/.env
cp services/media-service/.env.example services/media-service/.env
```

Edit each `.env` file with your database credentials and settings.

#### 3. Start Services

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm run dev
```

**Terminal 2 - Content Service:**
```bash
cd services/content-service
npm run dev
```

**Terminal 3 - Media Service:**
```bash
cd services/media-service
npm run dev
```

**Terminal 4 - API Gateway:**
```bash
cd api-gateway
npm run dev
```

## Testing the Services

### Health Checks

```bash
# Auth Service
curl http://localhost:3002/health

# Content Service
curl http://localhost:3004/health

# Media Service
curl http://localhost:3010/health

# API Gateway
curl http://localhost:3001/health
```

### Through API Gateway

All services are accessible through the API Gateway:

```bash
# Register user (Auth Service)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234"}'

# Create post (Content Service)
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Hello World!","type":"text"}'

# Upload image (Media Service)
curl -X POST http://localhost:3001/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

## Inter-Service Communication

Services communicate with each other through HTTP requests:

- **Content Service → Auth Service**: Validates user tokens via `/validate` endpoint
- **Media Service → Auth Service**: Validates user tokens via `/validate` endpoint
- **Content Service → Media Service**: Retrieves media information (future enhancement)

## Database Schema

All services share the same PostgreSQL database but access different tables:

- **Auth Service**: `users`, `sessions`, `login_attempts`, `verification_tokens`
- **Content Service**: `posts`, `comments`, `reactions`, `hope_stories`, `quotes`, `post_revisions`
- **Media Service**: `post_media`

## Production Deployment

### Building for Production

```bash
# Build all services
cd services/auth-service && npm run build
cd ../content-service && npm run build
cd ../media-service && npm run build
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Push to registry (if using)
docker-compose push

# Deploy
docker-compose up -d
```

### Environment Variables for Production

Ensure these are set in production:

- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random secret
- `CORS_ORIGIN` - Your frontend URL
- Service URLs for inter-service communication

## Monitoring & Logging

Each service includes:
- Health check endpoints
- Morgan HTTP request logging
- Error logging to console
- Graceful shutdown handlers

## Future Enhancements

Additional microservices planned:
- **User Service** (Port 3003) - User profiles and settings
- **Mood Service** (Port 3005) - Mood tracking
- **Chat Service** (Port 3006) - Real-time messaging
- **Moderation Service** (Port 3007) - Content moderation
- **Notification Service** (Port 3011) - Email and push notifications

## Troubleshooting

### Service won't start
- Check if port is already in use
- Verify database connection string
- Ensure all dependencies are installed

### Authentication errors
- Verify JWT_SECRET is the same across services
- Check token expiration settings
- Ensure Auth Service is running

### Database errors
- Verify PostgreSQL is running
- Check database credentials
- Run migrations if needed

## Support

For issues or questions, contact the SafeSpace development team.

