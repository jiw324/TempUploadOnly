"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/login
 * Login with research key
 */
router.post('/login', auth_controller_1.login);
/**
 * GET /api/auth/verify
 * Verify JWT token
 */
router.get('/verify', auth_middleware_1.authenticate, auth_controller_1.verify);
exports.default = router;
