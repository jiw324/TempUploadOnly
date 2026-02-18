"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// POST /api/admin/login — exchange ADMIN_KEY for a short-lived admin JWT
router.post('/login', admin_controller_1.adminLogin);
// All routes below require a valid admin JWT
router.get('/users', auth_middleware_1.requireAdmin, admin_controller_1.getAllUsers);
router.post('/users', auth_middleware_1.requireAdmin, admin_controller_1.createUser);
router.delete('/users/:userId', auth_middleware_1.requireAdmin, admin_controller_1.deleteUser);
router.put('/users/:userId/status', auth_middleware_1.requireAdmin, admin_controller_1.toggleUserStatus);
router.get('/conversations', auth_middleware_1.requireAdmin, admin_controller_1.getAllConversations);
router.get('/conversations/:conversationId/messages', auth_middleware_1.requireAdmin, admin_controller_1.getConversationMessages);
exports.default = router;
