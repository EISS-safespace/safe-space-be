# SafeSpace Backend API

<p align="center">
  <strong>Mental Wellness Social Platform - Backend API</strong>
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#api-documentation"><strong>API Documentation</strong></a> ·
  <a href="#project-structure"><strong>Project Structure</strong></a>
</p>

---

## Introduction

SafeSpace Backend API is a RESTful API built with Node.js, Express.js, and PostgreSQL. It provides the backend infrastructure for the SafeSpace mental wellness social platform, supporting features like dual identity posting, mood tracking, peer support, and real-time chat.

## Tech Stack

### Core Technologies
- **[Node.js](https://nodejs.org/)** (v22+) - JavaScript runtime
- **[TypeScript](https://www.typescriptlang.org/)** (v5.7) - Type safety
- **[Express.js](https://expressjs.com/)** (v4) - Web framework
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **[Sequelize](https://sequelize.org/)** (v6) - ORM for database operations

### Security & Authentication
- **[JWT](https://jwt.io/)** - JSON Web Tokens for authentication
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Password hashing
- **[Helmet](https://helmetjs.github.io/)** - Security headers
- **[CORS](https://www.npmjs.com/package/cors)** - Cross-origin resource sharing

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Vitest](https://vitest.dev/)** - Unit testing
- **[Morgan](https://www.npmjs.com/package/morgan)** - HTTP request logging

## Getting Started

### Prerequisites

- **Node.js LTS** (v22+) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v14+) - [Download here](https://www.postgresql.org/download/)
- **npm** or **yarn** - Package manager

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository-url>
   cd safe-space-be
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   Edit \`.env\` and configure your database and other settings.

4. **Create PostgreSQL database:**
   \`\`\`bash
   createdb safespace_db
   \`\`\`

5. **Build the project:**
   \`\`\`bash
   npm run build
   \`\`\`

6. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

   The API will be available at \`http://localhost:3001/api\`

## Available Scripts

\`\`\`bash
# Development
npm run dev          # Start development server with auto-reload
npm run build:watch  # Watch mode for TypeScript compilation

# Building
npm run build        # Build for production
npm run build:release # Clean build for production

# Code Quality
npm run lint         # Run ESLint
npm run prettier     # Format code with Prettier

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Utilities
npm run clean        # Remove build artifacts
\`\`\`

## Project Structure

```
safe-space-be/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # Database connection setup
│   │   └── index.ts         # App configuration
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts    # Authentication logic
│   │   ├── postController.ts    # Post management
│   │   └── moodController.ts    # Mood tracking
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── errorHandler.ts  # Error handling
│   │   └── validation.ts    # Request validation
│   ├── models/              # Sequelize models
│   │   ├── User.ts          # User model
│   │   ├── Post.ts          # Post model
│   │   ├── Comment.ts       # Comment model
│   │   ├── Reaction.ts      # Reaction model
│   │   ├── MoodEntry.ts     # Mood entry model
│   │   ├── ChatRoom.ts      # Chat room model
│   │   └── index.ts         # Model associations
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts    # Auth endpoints
│   │   ├── postRoutes.ts    # Post endpoints
│   │   ├── moodRoutes.ts    # Mood endpoints
│   │   └── index.ts         # Route aggregation
│   ├── utils/               # Utility functions
│   │   ├── jwt.ts           # JWT helpers
│   │   ├── password.ts      # Password hashing
│   │   └── anonymousAvatar.ts # Anonymous avatar generation
│   ├── app.ts               # Express app setup
│   └── main.ts              # Application entry point
├── __tests__/               # Test files
├── .env.example             # Environment variables template
├── package.json             # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "Display Name"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Post Endpoints

#### Create Post
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Post content",
  "isAnonymous": false,
  "postType": "vent",
  "triggerWarnings": ["anxiety"],
  "mood": "sad"
}
```

#### Get Posts
```http
GET /api/posts?mood=sad&postType=vent&page=1&limit=20
```

#### Get Post by ID
```http
GET /api/posts/:id
```

#### Delete Post
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

### Mood Endpoints

#### Create Mood Entry
```http
POST /api/mood
Authorization: Bearer <token>
Content-Type: application/json

{
  "mood": "happy",
  "intensity": 7,
  "notes": "Feeling good today",
  "date": "2024-01-15"
}
```

#### Get Mood Entries
```http
GET /api/mood?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Mood Statistics
```http
GET /api/mood/stats?days=30
Authorization: Bearer <token>
```

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `username` (String, Unique)
- `passwordHash` (String)
- `displayName` (String, Optional)
- `bio` (Text, Optional)
- `avatarUrl` (String, Optional)
- `isVerifiedTherapist` (Boolean)
- `allowAnonymous` (Boolean)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### Posts Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `content` (Text)
- `isAnonymous` (Boolean)
- `postType` (Enum: vent, success, question, general)
- `triggerWarnings` (Array)
- `mood` (String, Optional)
- `imageUrls` (Array, Optional)
- `audioUrl` (String, Optional)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### MoodEntries Table
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `mood` (Enum)
- `intensity` (Integer, 1-10)
- `notes` (Text, Optional)
- `date` (Date)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## Features Implemented

### ✅ Core Features
- [x] User authentication (register, login, JWT)
- [x] Dual identity system (profile/anonymous posting)
- [x] Post creation with trigger warnings
- [x] Mood tracking and statistics
- [x] Anonymous avatar generation
- [x] Post reactions ("Me Too" button)
- [x] Comments system

### 🚧 Upcoming Features
- [ ] Real-time chat (WebSocket)
- [ ] Buddy system matching
- [ ] AI content moderation
- [ ] Crisis detection and resources
- [ ] Hope Wall
- [ ] Wellness challenges
- [ ] Professional corner
- [ ] File uploads (images, voice notes)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_NAME=safespace_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=10

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# AI Configuration (Optional)
OPENAI_API_KEY=

# Upload Configuration
MAX_FILE_SIZE=5242880
```

## Development Workflow

### Git Workflow

**IMPORTANT**: Always pull the latest changes before starting work:

```bash
# Pull latest changes from main branch
git pull origin main

# OR create a new branch
git checkout -b "feature/your-feature-name"
```

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

## Deployment

### VM Deployment (University Provided)

1. Build the project:
   ```bash
   npm run build:release
   ```

2. Transfer files to VM:
   ```bash
   scp -r build/ user@vm-address:/path/to/app
   ```

3. Set up environment variables on VM

4. Start the application:
   ```bash
   npm start
   ```

## Contributing

1. Pull the latest changes from main
2. Create a new branch for your feature
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See [LICENSE](LICENSE) for details.

## Support

For issues and questions, please open an issue on GitHub or contact the development team.
