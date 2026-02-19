"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const litellm_routes_1 = __importDefault(require("./routes/litellm.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const database_1 = __importDefault(require("./config/database"));
const config_service_1 = require("./services/config.service");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3001;
// Middleware
app.use((0, helmet_1.default)()); // Security headers
// CORS - In development, localhost is always allowed.
// In production, set ALLOWED_ORIGINS in the environment (comma-separated).
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin)
            return callback(null, true);
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
app.use((0, morgan_1.default)('dev')); // Logging
app.use(express_1.default.json()); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded bodies
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
app.use('/api/auth', auth_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
app.use('/api/conversations', conversation_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/litellm', litellm_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
    });
});
// Error handler (must be last)
app.use(error_middleware_1.errorHandler);
// Start server
app.listen(PORT, '::', async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    // Test database connection
    console.log('\n🔌 Testing database connection...');
    const dbConnected = await database_1.default.testConnection();
    if (!dbConnected) {
        console.warn('⚠️  Database connection failed. Server will run but database operations will fail.');
        console.warn('⚠️  Please check your database configuration in .env file');
    }
    // Initialize configuration service
    if (dbConnected) {
        console.log('\n⚙️  Initializing configuration service...');
        try {
            await config_service_1.configService.ensureBasicConfigExists();
            console.log('✅ Configuration service initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize configuration service:', error);
        }
    }
    console.log('');
});
exports.default = app;
