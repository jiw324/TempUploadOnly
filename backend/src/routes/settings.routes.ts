import { Router } from 'express';
import { getSettings, updateSettings, resetSettings } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/settings/:userId
 * Get all AI settings for a user
 */
router.get('/:userId', authenticate, getSettings);

/**
 * PUT /api/settings/:userId/:modelName
 * Update AI settings for a specific model
 */
router.put('/:userId/:modelName', authenticate, updateSettings);

/**
 * DELETE /api/settings/:userId/:modelName
 * Reset AI settings for a specific model to defaults
 */
router.delete('/:userId/:modelName', authenticate, resetSettings);

export default router;

