# Human-AI Interaction Backend API

A robust Node.js/Express backend API built with TypeScript for the Human-AI Interaction Platform. Provides authentication, chat messaging, settings management, and conversation storage.

## 🚀 Features

- **RESTful API** with Express.js
- **TypeScript** for type safety
- **JWT Authentication** for secure access
- **CORS** enabled for frontend integration
- **Error Handling** with custom middleware
- **AI Chat Simulation** with contextual responses
- **Settings Management** for AI configurations
- **Conversation Storage** (in-memory, ready for database integration)
- **Health Check** endpoint for monitoring

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🛠️ Installation

1. Navigate to the backend directory:
```bash
cd human-ai-interaction-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
RESEARCH_KEY=admin123
```

## 🚀 Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "researchKey": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid"
}
```

### Chat

#### Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "conversationId": "uuid-here",
  "aiModel": {
    "id": "task1",
    "name": "Task 1",
    "greeting": "Hello!",
    "description": "Analytical AI"
  },
  "settings": {
    "personality": "analytical",
    "responseSpeed": "medium",
    "creativity": 50,
    "helpfulness": 80,
    "verbosity": 50,
    "temperature": 0.7,
    "maxTokens": 500,
    "systemPrompt": "You are an analytical AI assistant.",
    "taskPrompt": "Help users with analytical thinking."
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "id": "uuid",
    "text": "Hello! I'm doing well...",
    "sender": "ai",
    "timestamp": "2025-10-29T12:00:00.000Z"
  }
}
```

#### Stream Message (Server-Sent Events)
```http
POST /api/chat/stream
Content-Type: application/json

{
  "message": "Tell me a story",
  "aiModel": {...},
  "settings": {...}
}
```

### Settings

#### Get Settings
```http
GET /api/settings/:userId
Authorization: Bearer <token>
```

#### Update Settings
```http
PUT /api/settings/:userId/:modelName
Authorization: Bearer <token>
Content-Type: application/json

{
  "personality": "creative",
  "responseSpeed": "fast",
  "creativity": 80,
  "helpfulness": 90,
  "verbosity": 60,
  "temperature": 0.9,
  "maxTokens": 1000,
  "systemPrompt": "You are a creative AI assistant.",
  "taskPrompt": "Help with creative tasks."
}
```

#### Reset Settings
```http
DELETE /api/settings/:userId/:modelName
Authorization: Bearer <token>
```

### Conversations

#### Get All Conversations
```http
GET /api/conversations/:userId
Authorization: Bearer <token>
```

#### Get Specific Conversation
```http
GET /api/conversations/:userId/:conversationId
Authorization: Bearer <token>
```

#### Save Conversation
```http
POST /api/conversations/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "uuid",
  "title": "Chat with AI",
  "aiModel": {...},
  "messages": [...],
  "createdAt": "2025-10-29T12:00:00.000Z",
  "lastMessageAt": "2025-10-29T12:05:00.000Z"
}
```

#### Delete Conversation
```http
DELETE /api/conversations/:userId/:conversationId
Authorization: Bearer <token>
```

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T12:00:00.000Z",
  "uptime": 123.456
}
```

## 🗂️ Project Structure

```
human-ai-interaction-backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── settings.controller.ts
│   │   └── conversation.controller.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── settings.routes.ts
│   │   └── conversation.routes.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts
│   └── server.ts            # Main application entry
├── dist/                    # Compiled JavaScript (generated)
├── .env                     # Environment variables
├── .env.example             # Example environment config
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Helmet**: Security headers for Express
- **CORS**: Configurable origin restrictions
- **Environment Variables**: Sensitive data stored in `.env`
- **Error Handling**: Secure error messages (no stack traces in production)

## 🔄 Data Storage

Currently uses **in-memory storage** for:
- User settings
- Conversation history

### Migrating to Database

For production, replace in-memory storage with a database:

**Recommended options:**
- **MongoDB** with Mongoose (NoSQL)
- **PostgreSQL** with Prisma or TypeORM (SQL)
- **Redis** for caching and sessions

**Example MongoDB setup:**
```bash
npm install mongoose
```

## 🎯 AI Integration

The current implementation simulates AI responses. To integrate real AI services:

### OpenAI Integration
```bash
npm install openai
```

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ],
  temperature: settings.temperature,
  max_tokens: settings.maxTokens
});
```

### Anthropic (Claude) Integration
```bash
npm install @anthropic-ai/sdk
```

## 🧪 Testing

Add testing with Jest:

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts']
};
```

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🌐 Frontend Integration

Update your frontend to use the backend API:

```typescript
// Example API call from frontend
const response = await fetch('http://localhost:3001/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: userMessage,
    conversationId: conversationId,
    aiModel: selectedModel,
    settings: aiSettings
  })
});

const data = await response.json();
```

## 🐛 Debugging

Enable debug logging:
```env
NODE_ENV=development
DEBUG=*
```

## 📦 Deployment

### Docker (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Cloud Deployment

Deploy to:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **AWS EC2**: Use PM2 for process management
- **Vercel/Netlify**: Serverless functions

## 🤝 Contributing

Contributions welcome! Please follow:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License

---

**Note**: This backend currently simulates AI responses. For production use, integrate with real AI services (OpenAI, Anthropic, etc.) and replace in-memory storage with a proper database.

