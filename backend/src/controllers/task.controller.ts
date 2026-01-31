import { Request, Response } from 'express';
import db from '../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transform database row to frontend format
 */
const transformTaskFromDB = (dbTask: any) => {
  return {
    id: dbTask.id,
    name: dbTask.name,
    settings: {
      // AI Model Settings
      personality: dbTask.personality,
      responseSpeed: parseFloat(dbTask.response_speed),
      creativity: parseFloat(dbTask.creativity),
      helpfulness: parseFloat(dbTask.helpfulness),
      verbosity: parseFloat(dbTask.verbosity),
      temperature: parseFloat(dbTask.temperature),
      maxTokens: dbTask.max_tokens,
      systemPrompt: dbTask.system_prompt,
      taskPrompt: dbTask.task_prompt || '',
      // System Configuration
      llamaBaseUrl: dbTask.llama_base_url || 'https://llm-proxy.oai-at.org/',
      llamaServiceUrl: dbTask.llama_service_url || '',
      llamaApiKey: dbTask.llama_api_key || '',
      openaiApiKey: dbTask.openai_api_key || '',
      anthropicApiKey: dbTask.anthropic_api_key || '',
      defaultModel: dbTask.default_model || 'gpt-4',
      autoUpdateRobotList: Boolean(dbTask.auto_update_robot_list)
    }
  };
};

/**
 * Get all tasks for the authenticated user
 */
export const getAllTasks = async (req: Request, res: Response) => {
  try {
    // Get user ID from authenticated request
    const userId = (req as any).user?.id || 'admin-001'; // Fallback for development
    
    console.log('📤 [Backend] Fetching tasks from database for user:', userId);
    
    // Query database for user's tasks
    const tasks = await db.query(
      `SELECT * FROM tasks 
       WHERE user_id = ? 
       ORDER BY created_at ASC`,
      [userId]
    );
    
    console.log(`📊 [Backend] Found ${tasks.length} tasks in database`);
    
    // Transform to frontend format
    const transformedTasks = tasks.map((t: any) => transformTaskFromDB(t));
    
    console.log('📋 [Backend] Task names:', transformedTasks.map((t: any) => t.name).join(', '));
    
    res.status(200).json({
      success: true,
      data: transformedTasks
    });
    
    console.log('✅ [Backend] Tasks sent successfully');
  } catch (error) {
    console.error('❌ [Backend] Error fetching tasks from database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Get a single task by ID
 */
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'admin-001';
    
    console.log(`🔍 [Backend] Fetching task ${id} for user ${userId}`);
    
    const task = await db.queryOne(
      `SELECT * FROM tasks 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    if (!task) {
      console.log('⚠️ [Backend] Task not found');
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    const transformedTask = transformTaskFromDB(task);
    
    console.log('✅ [Backend] Task found:', transformedTask.name);
    
    res.status(200).json({
      success: true,
      data: transformedTask
    });
  } catch (error) {
    console.error('❌ [Backend] Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, settings } = req.body;
    const userId = (req as any).user?.id || 'admin-001';
    
    // Validation
    if (!name || !settings) {
      res.status(400).json({
        success: false,
        message: 'Task name and settings are required'
      });
      return;
    }
    
    console.log('➕ [Backend] Creating new task:', name);
    
    // Check if task name already exists for this user
    const existingTask = await db.queryOne(
      `SELECT id FROM tasks 
       WHERE user_id = ? AND name = ?`,
      [userId, name]
    );
    
    if (existingTask) {
      console.log('⚠️ [Backend] Task name already exists:', name);
      res.status(409).json({
        success: false,
        message: `A task named "${name}" already exists. Please choose a different name.`
      });
      return;
    }
    
    const taskId = uuidv4();
    
    // Insert new task
    await db.query(
      `INSERT INTO tasks (
        id, user_id, name,
        personality, response_speed, creativity, helpfulness, verbosity,
        temperature, max_tokens, system_prompt, task_prompt,
        llama_base_url, llama_service_url, llama_api_key,
        openai_api_key, anthropic_api_key, default_model, auto_update_robot_list
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        userId,
        name,
        settings.personality || 'friendly',
        settings.responseSpeed || 1.0,
        settings.creativity || 0.7,
        settings.helpfulness || 0.9,
        settings.verbosity || 0.6,
        settings.temperature || 0.7,
        settings.maxTokens || 1000,
        settings.systemPrompt || 'You are a helpful AI assistant.',
        settings.taskPrompt || 'Please provide specific instructions or context for this task. This prompt will guide the AI in understanding your specific requirements and objectives.',
        settings.llamaBaseUrl || 'https://llm-proxy.oai-at.org/',
        settings.llamaServiceUrl || '',
        settings.llamaApiKey || '',
        settings.openaiApiKey || '',
        settings.anthropicApiKey || '',
        settings.defaultModel || '',
        settings.autoUpdateRobotList || false
      ]
    );
    
    // Fetch the created task
    const createdTask = await db.queryOne(
      `SELECT * FROM tasks WHERE id = ?`,
      [taskId]
    );
    
    if (!createdTask) {
      throw new Error('Failed to retrieve created task');
    }
    
    const transformedTask = transformTaskFromDB(createdTask);
    
    console.log('✅ [Backend] Task created successfully:', transformedTask.name);
    
    res.status(201).json({
      success: true,
      data: transformedTask,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('❌ [Backend] Error creating task:', error);
    
    // Handle duplicate entry error
    if ((error as any).code === 'ER_DUP_ENTRY') {
      res.status(409).json({
        success: false,
        message: 'A task with this name already exists. Please choose a different name.'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Update a task
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, settings } = req.body;
    const userId = (req as any).user?.id || 'admin-001';
    
    console.log('🔄 [Backend] Updating task:', id);
    
    // Check if task exists and belongs to user
    const existingTask = await db.queryOne(
      `SELECT * FROM tasks 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    if (!existingTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // If name is being updated, check for duplicates
    if (name && name !== existingTask.name) {
      const duplicate = await db.queryOne(
        `SELECT id FROM tasks 
         WHERE user_id = ? AND name = ? AND id != ?`,
        [userId, name, id]
      );
      
      if (duplicate) {
        res.status(409).json({
          success: false,
          message: 'Task with this name already exists'
        });
        return;
      }
    }
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (settings) {
      if (settings.personality !== undefined) {
        updates.push('personality = ?');
        values.push(settings.personality);
      }
      if (settings.responseSpeed !== undefined) {
        updates.push('response_speed = ?');
        values.push(settings.responseSpeed);
      }
      if (settings.creativity !== undefined) {
        updates.push('creativity = ?');
        values.push(settings.creativity);
      }
      if (settings.helpfulness !== undefined) {
        updates.push('helpfulness = ?');
        values.push(settings.helpfulness);
      }
      if (settings.verbosity !== undefined) {
        updates.push('verbosity = ?');
        values.push(settings.verbosity);
      }
      if (settings.temperature !== undefined) {
        updates.push('temperature = ?');
        values.push(settings.temperature);
      }
      if (settings.maxTokens !== undefined) {
        updates.push('max_tokens = ?');
        values.push(settings.maxTokens);
      }
      if (settings.systemPrompt !== undefined) {
        updates.push('system_prompt = ?');
        values.push(settings.systemPrompt);
      }
      if (settings.taskPrompt !== undefined) {
        updates.push('task_prompt = ?');
        values.push(settings.taskPrompt);
      }
      if (settings.llamaBaseUrl !== undefined) {
        updates.push('llama_base_url = ?');
        values.push(settings.llamaBaseUrl);
      }
      if (settings.llamaServiceUrl !== undefined) {
        updates.push('llama_service_url = ?');
        values.push(settings.llamaServiceUrl);
      }
      if (settings.llamaApiKey !== undefined) {
        updates.push('llama_api_key = ?');
        values.push(settings.llamaApiKey);
      }
      if (settings.openaiApiKey !== undefined) {
        updates.push('openai_api_key = ?');
        values.push(settings.openaiApiKey);
      }
      if (settings.anthropicApiKey !== undefined) {
        updates.push('anthropic_api_key = ?');
        values.push(settings.anthropicApiKey);
      }
      if (settings.defaultModel !== undefined) {
        updates.push('default_model = ?');
        values.push(settings.defaultModel);
      }
      if (settings.autoUpdateRobotList !== undefined) {
        updates.push('auto_update_robot_list = ?');
        values.push(settings.autoUpdateRobotList);
      }
    }
    
    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
      return;
    }
    
    // Add task ID to values
    values.push(id);
    
    // Execute update
    await db.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Fetch updated task
    const updatedTask = await db.queryOne(
      `SELECT * FROM tasks WHERE id = ?`,
      [id]
    );
    
    if (!updatedTask) {
      throw new Error('Failed to retrieve updated task');
    }
    
    const transformedTask = transformTaskFromDB(updatedTask);
    
    console.log('✅ [Backend] Task updated successfully:', transformedTask.name);
    
    res.status(200).json({
      success: true,
      data: transformedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('❌ [Backend] Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

/**
 * Delete a task (soft delete)
 */
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'admin-001';
    
    console.log('🗑️ [Backend] Deleting task:', id);
    
    // Check if task exists and belongs to user
    const task = await db.queryOne(
      `SELECT * FROM tasks 
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }
    
    // Allow deleting all tasks (user can have 0 tasks)
    
    // Hard delete (permanently remove from database)
    await db.query(
      `DELETE FROM tasks WHERE id = ?`,
      [id]
    );
    
    console.log('✅ [Backend] Task permanently deleted from database:', task.name);
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('❌ [Backend] Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};
