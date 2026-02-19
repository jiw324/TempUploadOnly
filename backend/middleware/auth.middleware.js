"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.requireAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
/**
 * Admin middleware — verifies the JWT carries role: 'admin'
 */
const requireAdmin = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.AppError('No token provided', 401);
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (decoded.role !== 'admin') {
            throw new error_middleware_1.AppError('Admin access required', 403);
        }
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new error_middleware_1.AppError('Invalid token', 401));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new error_middleware_1.AppError('Token expired', 401));
        }
        else {
            next(error);
        }
    }
};
exports.requireAdmin = requireAdmin;
const authenticate = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.AppError('No token provided', 401);
        }
        const token = authHeader.substring(7);
        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new error_middleware_1.AppError('Invalid token', 401));
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            next(new error_middleware_1.AppError('Token expired', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
