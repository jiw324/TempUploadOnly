import { Router } from 'express';
import { login, verify } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Login with research key
 */
router.post('/login', login);

/**
 * GET /api/auth/verify
 * Verify JWT token
 */
router.get('/verify', authenticate, verify);

export default router;

