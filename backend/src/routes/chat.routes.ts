import { Router } from 'express';
import { sendMessage, streamMessage } from '../controllers/chat.controller';

const router = Router();

/**
 * POST /api/chat/message
 * Send a message and get AI response
 */
router.post('/message', sendMessage);

/**
 * POST /api/chat/stream
 * Send a message and stream AI response
 */
router.post('/stream', streamMessage);

export default router;

