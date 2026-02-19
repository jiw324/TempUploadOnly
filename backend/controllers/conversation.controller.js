"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.saveConversation = exports.getConversation = exports.getConversations = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const database_1 = __importDefault(require("../config/database"));
const getConversations = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            throw new error_middleware_1.AppError('User ID is required', 400);
        }
        console.log('📡 [Backend] Fetching conversations from database for:', userId);
        const dbConversations = await database_1.default.query(`SELECT * FROM conversations
       WHERE user_id = ?
       ORDER BY last_message_at DESC`, [userId]);
        // For each conversation, only fetch message count and last message preview
        const conversations = await Promise.all(dbConversations.map(async (conv) => {
            // Get message count
            const countResult = await database_1.default.queryOne(`SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?`, [conv.id]);
            const messageCount = countResult?.count || 0;
            // Get last message for preview (only the last one, not all messages)
            const lastMessage = await database_1.default.queryOne(`SELECT id, text, sender, timestamp 
           FROM messages 
           WHERE conversation_id = ? 
           ORDER BY timestamp DESC 
           LIMIT 1`, [conv.id]);
            return {
                id: conv.id,
                title: conv.title,
                aiModel: {
                    name: conv.ai_model_name,
                    personality: conv.ai_model_personality,
                    icon: conv.ai_model_icon,
                    greeting: ''
                },
                messages: lastMessage ? [{
                        id: lastMessage.id,
                        text: lastMessage.text,
                        sender: lastMessage.sender,
                        timestamp: new Date(lastMessage.timestamp)
                    }] : [],
                messageCount: messageCount, // Add message count separately
                createdAt: new Date(conv.created_at),
                lastMessageAt: new Date(conv.last_message_at)
            };
        }));
        console.log(`✅ [Backend] Found ${conversations.length} conversations`);
        console.log(`📋 [Backend] Conversation IDs: ${conversations.map(c => c.id).join(', ')}`);
        console.log(`📋 [Backend] Conversation Titles: ${conversations.map(c => c.title).join(', ')}`);
        res.json({
            success: true,
            conversations
        });
    }
    catch (error) {
        console.error('❌ [Backend] Error fetching conversations:', error);
        next(error);
    }
};
exports.getConversations = getConversations;
const getConversation = async (req, res, next) => {
    try {
        const { userId, conversationId } = req.params;
        if (!userId || !conversationId) {
            throw new error_middleware_1.AppError('User ID and conversation ID are required', 400);
        }
        console.log('🔍 [Backend] Fetching conversation from database:', conversationId);
        const conv = await database_1.default.queryOne(`SELECT * FROM conversations WHERE id = ? AND user_id = ?`, [conversationId, userId]);
        if (!conv) {
            throw new error_middleware_1.AppError('Conversation not found', 404);
        }
        // Fetch messages
        const messages = await database_1.default.query(`SELECT id, text, sender, timestamp 
       FROM messages 
       WHERE conversation_id = ? 
       ORDER BY timestamp ASC`, [conversationId]);
        const conversation = {
            id: conv.id,
            title: conv.title,
            aiModel: {
                name: conv.ai_model_name,
                personality: conv.ai_model_personality,
                icon: conv.ai_model_icon,
                greeting: ''
            },
            messages: messages.map((msg) => ({
                id: msg.id,
                text: msg.text,
                sender: msg.sender,
                timestamp: new Date(msg.timestamp)
            })),
            createdAt: new Date(conv.created_at),
            lastMessageAt: new Date(conv.last_message_at)
        };
        console.log('✅ [Backend] Conversation found');
        res.json({
            success: true,
            conversation
        });
    }
    catch (error) {
        console.error('❌ [Backend] Error fetching conversation:', error);
        next(error);
    }
};
exports.getConversation = getConversation;
// Helper: format a Date as EST (America/New_York) in MySQL DATETIME format
const formatAsESTDateTime = (date) => {
    const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    const hour = String(estDate.getHours()).padStart(2, '0');
    const minute = String(estDate.getMinutes()).padStart(2, '0');
    const second = String(estDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
const saveConversation = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const conversation = req.body;
        if (!userId) {
            throw new error_middleware_1.AppError('User ID is required', 400);
        }
        if (!conversation.id || !conversation.messages) {
            throw new error_middleware_1.AppError('Invalid conversation data', 400);
        }
        console.log('💾 [Backend] Saving conversation to database:', conversation.id);
        // Check if conversation exists
        const existing = await database_1.default.queryOne('SELECT id FROM conversations WHERE id = ?', [conversation.id]);
        if (existing) {
            // Update existing conversation
            // Convert JavaScript Date to MySQL format (force EST)
            const lastMessageAt = formatAsESTDateTime(new Date(conversation.lastMessageAt));
            await database_1.default.query(`UPDATE conversations 
         SET title = ?, last_message_at = ? 
         WHERE id = ?`, [conversation.title, lastMessageAt, conversation.id]);
        }
        else {
            // Insert new conversation
            // Convert JavaScript Date to MySQL format (YYYY-MM-DD HH:MM:SS) in EST
            const createdAt = formatAsESTDateTime(new Date(conversation.createdAt));
            const lastMessageAt = formatAsESTDateTime(new Date(conversation.lastMessageAt));
            await database_1.default.query(`INSERT INTO conversations 
         (id, user_id, title, ai_model_name, ai_model_personality, ai_model_icon, created_at, last_message_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                conversation.id,
                userId,
                conversation.title,
                conversation.aiModel.name,
                conversation.aiModel.personality,
                conversation.aiModel.icon,
                createdAt,
                lastMessageAt
            ]);
        }
        // Use REPLACE INTO to handle duplicates (deletes and inserts in one atomic operation)
        for (const message of conversation.messages) {
            // Convert JavaScript Date to MySQL format in EST
            const timestamp = formatAsESTDateTime(new Date(message.timestamp));
            await database_1.default.query(`REPLACE INTO messages (id, conversation_id, text, sender, timestamp) 
         VALUES (?, ?, ?, ?, ?)`, [message.id, conversation.id, message.text, message.sender, timestamp]);
        }
        console.log('✅ [Backend] Conversation saved successfully');
        res.json({
            success: true,
            message: 'Conversation saved successfully',
            conversation
        });
    }
    catch (error) {
        console.error('❌ [Backend] Error saving conversation:', error);
        next(error);
    }
};
exports.saveConversation = saveConversation;
const deleteConversation = async (req, res, next) => {
    try {
        const { userId, conversationId } = req.params;
        if (!userId || !conversationId) {
            throw new error_middleware_1.AppError('User ID and conversation ID are required', 400);
        }
        console.log('🗑️ [Backend] Deleting conversation from database:', conversationId);
        const result = await database_1.default.query('DELETE FROM conversations WHERE id = ? AND user_id = ?', [conversationId, userId]);
        if (result.affectedRows === 0) {
            throw new error_middleware_1.AppError('Conversation not found', 404);
        }
        console.log('✅ [Backend] Conversation deleted successfully');
        res.json({
            success: true,
            message: 'Conversation deleted successfully'
        });
    }
    catch (error) {
        console.error('❌ [Backend] Error deleting conversation:', error);
        next(error);
    }
};
exports.deleteConversation = deleteConversation;
