import { Request, Response, NextFunction } from 'express';
import { Conversation } from '../types';
import { AppError } from '../middleware/error.middleware';
import db from '../config/database';

/**
 * Ensure user exists in database (auto-create for device IDs)
 */
async function ensureUserExists(userId: string): Promise<void> {
  try {
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (!existingUser) {
      // Auto-create user record for this device
      // Use full device ID as username to avoid collisions
      await db.query(
        `INSERT INTO users (id, username, email, password_hash, research_key) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          userId, // Use full device ID as username (guaranteed unique)
          `${userId}@device.local`, // Email: deviceid@device.local
          '', // No password for device users
          null // NULL for research_key (empty string would violate UNIQUE constraint)
        ]
      );
      console.log('✨ [Backend] Auto-created user record for device:', userId);
    }
  } catch (error) {
    console.error('⚠️ [Backend] Error ensuring user exists:', error);
    // Don't throw - let the conversation operation continue
  }
}

export const getConversations = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    console.log('📡 [Backend] Fetching conversations from database for:', userId);
    
    // Auto-create user record if device ID doesn't exist
    await ensureUserExists(userId);

    // Check if this is an admin user (has research_key, not a device ID)
    const isAdmin = userId === 'admin-001' || !userId.startsWith('device_');
    
    // Fetch conversations from database (metadata only, no messages)
    // Admin sees ALL conversations, regular users see only their own
    let dbConversations;
    if (isAdmin) {
      console.log('👑 [Backend] Admin user - fetching ALL conversations');
      dbConversations = await db.query(
        `SELECT * FROM conversations 
         ORDER BY last_message_at DESC`
      );
    } else {
      console.log('📱 [Backend] Device user - fetching device-specific conversations');
      dbConversations = await db.query(
        `SELECT * FROM conversations 
         WHERE user_id = ? 
         ORDER BY last_message_at DESC`,
        [userId]
      );
    }

    // For each conversation, only fetch message count and last message preview
    const conversations = await Promise.all(
      dbConversations.map(async (conv: any) => {
        // Get message count
        const countResult = await db.queryOne(
          `SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?`,
          [conv.id]
        );
        const messageCount = countResult?.count || 0;

        // Get last message for preview (only the last one, not all messages)
        const lastMessage = await db.queryOne(
          `SELECT id, text, sender, timestamp 
           FROM messages 
           WHERE conversation_id = ? 
           ORDER BY timestamp DESC 
           LIMIT 1`,
          [conv.id]
        );

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
      })
    );

    console.log(`✅ [Backend] Found ${conversations.length} conversations`);
    console.log(`📋 [Backend] Conversation IDs: ${conversations.map(c => c.id).join(', ')}`);
    console.log(`📋 [Backend] Conversation Titles: ${conversations.map(c => c.title).join(', ')}`);

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('❌ [Backend] Error fetching conversations:', error);
    next(error);
  }
};

export const getConversation = async (
  req: Request<{ userId: string; conversationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, conversationId } = req.params;

    if (!userId || !conversationId) {
      throw new AppError('User ID and conversation ID are required', 400);
    }

    console.log('🔍 [Backend] Fetching conversation from database:', conversationId);

    // Check if this is an admin user
    const isAdmin = userId === 'admin-001' || !userId.startsWith('device_');
    
    // Fetch conversation
    // Admin can fetch any conversation, regular users only their own
    let conv;
    if (isAdmin) {
      console.log('👑 [Backend] Admin user - fetching conversation without user restriction');
      conv = await db.queryOne(
        `SELECT * FROM conversations 
         WHERE id = ?`,
        [conversationId]
      );
    } else {
      console.log('📱 [Backend] Device user - fetching device-specific conversation');
      conv = await db.queryOne(
        `SELECT * FROM conversations 
         WHERE id = ? AND user_id = ?`,
        [conversationId, userId]
      );
    }

    if (!conv) {
      throw new AppError('Conversation not found', 404);
    }

    // Fetch messages
    const messages = await db.query(
      `SELECT id, text, sender, timestamp 
       FROM messages 
       WHERE conversation_id = ? 
       ORDER BY timestamp ASC`,
      [conversationId]
    );

    const conversation = {
      id: conv.id,
      title: conv.title,
      aiModel: {
        name: conv.ai_model_name,
        personality: conv.ai_model_personality,
        icon: conv.ai_model_icon,
        greeting: ''
      },
      messages: messages.map((msg: any) => ({
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
  } catch (error) {
    console.error('❌ [Backend] Error fetching conversation:', error);
    next(error);
  }
};

// Helper: format a Date as EST (America/New_York) in MySQL DATETIME format
const formatAsESTDateTime = (date: Date) => {
  const estDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  const hour = String(estDate.getHours()).padStart(2, '0');
  const minute = String(estDate.getMinutes()).padStart(2, '0');
  const second = String(estDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

export const saveConversation = async (
  req: Request<{ userId: string }, {}, Conversation>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const conversation = req.body;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    if (!conversation.id || !conversation.messages) {
      throw new AppError('Invalid conversation data', 400);
    }

    console.log('💾 [Backend] Saving conversation to database:', conversation.id);
    
    // Auto-create user record if device ID doesn't exist
    await ensureUserExists(userId);

    // Check if conversation exists
    const existing = await db.queryOne(
      'SELECT id FROM conversations WHERE id = ?',
      [conversation.id]
    );

    if (existing) {
      // Update existing conversation
      // Convert JavaScript Date to MySQL format (force EST)
      const lastMessageAt = formatAsESTDateTime(new Date(conversation.lastMessageAt));
      
      await db.query(
        `UPDATE conversations 
         SET title = ?, last_message_at = ? 
         WHERE id = ?`,
        [conversation.title, lastMessageAt, conversation.id]
      );
    } else {
      // Insert new conversation
      // Convert JavaScript Date to MySQL format (YYYY-MM-DD HH:MM:SS) in EST
      const createdAt = formatAsESTDateTime(new Date(conversation.createdAt));
      const lastMessageAt = formatAsESTDateTime(new Date(conversation.lastMessageAt));
      
      await db.query(
        `INSERT INTO conversations 
         (id, user_id, title, ai_model_name, ai_model_personality, ai_model_icon, created_at, last_message_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conversation.id,
          userId,
          conversation.title,
          conversation.aiModel.name,
          conversation.aiModel.personality,
          conversation.aiModel.icon,
          createdAt,
          lastMessageAt
        ]
      );
    }

    // Use REPLACE INTO to handle duplicates (deletes and inserts in one atomic operation)
    for (const message of conversation.messages) {
      // Convert JavaScript Date to MySQL format in EST
      const timestamp = formatAsESTDateTime(new Date(message.timestamp));
      
      await db.query(
        `REPLACE INTO messages (id, conversation_id, text, sender, timestamp) 
         VALUES (?, ?, ?, ?, ?)`,
        [message.id, conversation.id, message.text, message.sender, timestamp]
      );
    }

    console.log('✅ [Backend] Conversation saved successfully');

    res.json({
      success: true,
      message: 'Conversation saved successfully',
      conversation
    });
  } catch (error) {
    console.error('❌ [Backend] Error saving conversation:', error);
    next(error);
  }
};

export const deleteConversation = async (
  req: Request<{ userId: string; conversationId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, conversationId } = req.params;

    if (!userId || !conversationId) {
      throw new AppError('User ID and conversation ID are required', 400);
    }

    console.log('🗑️ [Backend] Deleting conversation from database:', conversationId);

    // Check if this is an admin user
    const isAdmin = userId === 'admin-001' || !userId.startsWith('device_');
    
    // Delete conversation (messages will cascade delete)
    // Admin can delete any conversation, regular users only their own
    let result;
    if (isAdmin) {
      console.log('👑 [Backend] Admin user - deleting conversation without user restriction');
      result = await db.query(
        'DELETE FROM conversations WHERE id = ?',
        [conversationId]
      );
    } else {
      console.log('📱 [Backend] Device user - deleting device-specific conversation');
      result = await db.query(
        'DELETE FROM conversations WHERE id = ? AND user_id = ?',
        [conversationId, userId]
      );
    }

    if ((result as any).affectedRows === 0) {
      throw new AppError('Conversation not found', 404);
    }

    console.log('✅ [Backend] Conversation deleted successfully');

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('❌ [Backend] Error deleting conversation:', error);
    next(error);
  }
};

