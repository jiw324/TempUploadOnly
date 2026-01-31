/**
 * LiteLLM Routes
 * API routes for LiteLLM integration
 */

import { Router } from 'express';
import { liteLLMController } from '../controllers/litellm.controller';

const router = Router();

// Public routes (no authentication required for now, can add later)
router.get('/models', liteLLMController.getModels);
router.get('/config', liteLLMController.getConfig);
router.post('/config', liteLLMController.updateConfig);
router.post('/test-connection', liteLLMController.testConnection);

export default router;

