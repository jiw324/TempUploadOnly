import { Router } from 'express';
import {
  getConversations,
  getConversation,
  saveConversation,
  deleteConversation
} from '../controllers/conversation.controller';

const router = Router();

/**
 * GET /api/conversations/:userId
 * Get all conversations for a user
 * NOTE: No authentication required - allows loading chats without login
 */
router.get('/:userId', getConversations);

/**
 * GET /api/conversations/:userId/:conversationId
 * Get a specific conversation
 * NOTE: No authentication required - allows loading chats without login
 */
router.get('/:userId/:conversationId', getConversation);

/**
 * POST /api/conversations/:userId
 * Save a conversation
 * NOTE: No authentication required - allows saving chats without login
 */
router.post('/:userId', saveConversation);

/**
 * DELETE /api/conversations/:userId/:conversationId
 * Delete a conversation
 * NOTE: No authentication required - allows deleting chats without login
 */
router.delete('/:userId/:conversationId', deleteConversation);

export default router;

