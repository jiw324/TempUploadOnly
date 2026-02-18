"use strict";
/**
 * LiteLLM Routes
 * API routes for LiteLLM integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const litellm_controller_1 = require("../controllers/litellm.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public route — any visitor can browse available models
router.get('/models', litellm_controller_1.liteLLMController.getModels);
// Researcher-only routes — require JWT (config contains API keys)
router.get('/config', auth_middleware_1.authenticate, litellm_controller_1.liteLLMController.getConfig);
router.post('/config', auth_middleware_1.authenticate, litellm_controller_1.liteLLMController.updateConfig);
router.post('/test-connection', auth_middleware_1.authenticate, litellm_controller_1.liteLLMController.testConnection);
exports.default = router;
