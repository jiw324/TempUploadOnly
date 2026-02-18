"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/settings/:userId
 * Get all AI settings for a user
 */
router.get('/:userId', auth_middleware_1.authenticate, settings_controller_1.getSettings);
/**
 * PUT /api/settings/:userId/:modelName
 * Update AI settings for a specific model
 */
router.put('/:userId/:modelName', auth_middleware_1.authenticate, settings_controller_1.updateSettings);
/**
 * DELETE /api/settings/:userId/:modelName
 * Reset AI settings for a specific model to defaults
 */
router.delete('/:userId/:modelName', auth_middleware_1.authenticate, settings_controller_1.resetSettings);
exports.default = router;
