import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import settingsRoutes from './routes/settings.routes';
import conversationRoutes from './routes/conversation.routes';
import taskRoutes from './routes/task.routes';
import litellmRoutes from './routes/litellm.routes';
import { errorHandler } from './middleware/error.middleware';
import db from './config/database';
import { configService } from './services/config.service';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers

// CORS - Allow all localhost origins in development
// and the commresearch-dev host in production (for the deployed frontend).
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://commresearch-dev.org.ohio-state.edu'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Check allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Request logger middleware
app.use((req, _res, next) => {
  console.log(`\n📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  console.log(`   Origin: ${req.headers.origin || 'no origin'}`);
  console.log(`   Auth: ${req.headers.authorization ? '✅ Token present' : '❌ No token'}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  console.log('✅ Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/litellm', litellmRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  
  // Test database connection
  console.log('\n🔌 Testing database connection...');
  const dbConnected = await db.testConnection();
  if (!dbConnected) {
    console.warn('⚠️  Database connection failed. Server will run but database operations will fail.');
    console.warn('⚠️  Please check your database configuration in .env file');
  }
  
  // Initialize configuration service
  if (dbConnected) {
    console.log('\n⚙️  Initializing configuration service...');
    try {
      await configService.ensureBasicConfigExists();
      console.log('✅ Configuration service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize configuration service:', error);
    }
  }
  
  console.log('');
});

export default app;

