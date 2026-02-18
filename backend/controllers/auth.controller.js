"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("../middleware/error.middleware");
const database_1 = __importDefault(require("../config/database"));
const login = async (req, res, next) => {
    try {
        const { researchKey } = req.body;
        console.log('🔐 [Backend] Login attempt received');
        if (!researchKey) {
            console.log('❌ [Backend] No research key provided');
            throw new error_middleware_1.AppError('Research key is required', 400);
        }
        // Validate research key against database
        console.log('🔍 [Backend] Checking research key in database...');
        const user = await database_1.default.queryOne('SELECT id, username, email, research_key FROM users WHERE research_key = ? AND is_active = TRUE', [researchKey]);
        if (!user) {
            console.log('❌ [Backend] Invalid research key - no matching user found');
            throw new error_middleware_1.AppError('Invalid research key', 401);
        }
        console.log(`✅ [Backend] User found: ${user.username} (${user.email})`);
        // Generate JWT token with user info
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            email: user.email
        }, jwtSecret, { expiresIn: '24h' });
        console.log('✅ [Backend] Login successful, token generated');
        console.log(`👤 [Backend] User ID: ${user.id}`);
        res.json({
            success: true,
            token,
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error('❌ [Backend] Login error:', error);
        next(error);
    }
};
exports.login = login;
const verify = async (_req, res, next) => {
    try {
        // If this route is reached, the token is valid (checked by middleware)
        res.json({
            success: true,
            message: 'Token is valid'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verify = verify;
