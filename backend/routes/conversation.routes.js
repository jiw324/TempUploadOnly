"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversation_controller_1 = require("../controllers/conversation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/conversations/:userId — researcher views their own history (requires auth)
router.get('/:userId', auth_middleware_1.authenticate, conversation_controller_1.getConversations);
// GET /api/conversations/:userId/:conversationId — researcher fetches full convo (requires auth)
router.get('/:userId/:conversationId', auth_middleware_1.authenticate, conversation_controller_1.getConversation);
// POST /api/conversations/:userId — save a conversation
// No auth: participants save under the researcher's UUID without holding a JWT
router.post('/:userId', conversation_controller_1.saveConversation);
// DELETE /api/conversations/:userId/:conversationId — researcher deletes a convo (requires auth)
router.delete('/:userId/:conversationId', auth_middleware_1.authenticate, conversation_controller_1.deleteConversation);
exports.default = router;
