"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.getTasksByUserId = exports.getResearchGroups = exports.updateTask = exports.createTask = exports.getTaskById = exports.getAllTasks = void 0;
const database_1 = __importDefault(require("../config/database"));
const uuid_1 = require("uuid");
/**
 * Transform database row to frontend format
 */
const transformTaskFromDB = (dbTask) => {
    return {
        id: dbTask.id,
        name: dbTask.name,
        settings: {
            systemPrompt: dbTask.system_prompt,
            taskPrompt: dbTask.task_prompt || '',
            defaultModel: dbTask.default_model || ''
        }
    };
};
/**
 * Get all tasks for the authenticated user
 */
const getAllTasks = async (req, res) => {
    try {
        // Get user ID from authenticated request
        const userId = req.user.id;
        console.log('📤 [Backend] Fetching tasks from database for user:', userId);
        // Query database for user's tasks
        const tasks = await database_1.default.query(`SELECT * FROM tasks
       WHERE user_id = ?
       ORDER BY name ASC`, [userId]);
        console.log(`📊 [Backend] Found ${tasks.length} tasks in database`);
        // Transform to frontend format
        const transformedTasks = tasks.map((t) => transformTaskFromDB(t));
        console.log('📋 [Backend] Task names:', transformedTasks.map((t) => t.name).join(', '));
        res.status(200).json({
            success: true,
            data: transformedTasks
        });
        console.log('✅ [Backend] Tasks sent successfully');
    }
    catch (error) {
        console.error('❌ [Backend] Error fetching tasks from database:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getAllTasks = getAllTasks;
/**
 * Get a single task by ID
 */
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        console.log(`🔍 [Backend] Fetching task ${id} for user ${userId}`);
        const task = await database_1.default.queryOne(`SELECT * FROM tasks 
       WHERE id = ? AND user_id = ?`, [id, userId]);
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
    }
    catch (error) {
        console.error('❌ [Backend] Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch task',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getTaskById = getTaskById;
/**
 * Create a new task
 */
const createTask = async (req, res) => {
    try {
        const { name, settings } = req.body;
        const userId = req.user.id;
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
        const existingTask = await database_1.default.queryOne(`SELECT id FROM tasks 
       WHERE user_id = ? AND name = ?`, [userId, name]);
        if (existingTask) {
            console.log('⚠️ [Backend] Task name already exists:', name);
            res.status(409).json({
                success: false,
                message: `A task named "${name}" already exists. Please choose a different name.`
            });
            return;
        }
        const taskId = (0, uuid_1.v4)();
        // Insert new task
        await database_1.default.query(`INSERT INTO tasks (id, user_id, name, system_prompt, task_prompt, default_model)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            taskId,
            userId,
            name,
            settings.systemPrompt || 'You are a helpful AI assistant.',
            settings.taskPrompt || '',
            settings.defaultModel || ''
        ]);
        // Fetch the created task
        const createdTask = await database_1.default.queryOne(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
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
    }
    catch (error) {
        console.error('❌ [Backend] Error creating task:', error);
        // Handle duplicate entry error
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({
                success: false,
                message: 'A task with this name already exists. Please choose a different name.'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create task',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.createTask = createTask;
/**
 * Update a task
 */
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, settings } = req.body;
        const userId = req.user.id;
        console.log('🔄 [Backend] Updating task:', id);
        // Check if task exists and belongs to user
        const existingTask = await database_1.default.queryOne(`SELECT * FROM tasks 
       WHERE id = ? AND user_id = ?`, [id, userId]);
        if (!existingTask) {
            res.status(404).json({
                success: false,
                message: 'Task not found'
            });
            return;
        }
        // If name is being updated, check for duplicates
        if (name && name !== existingTask.name) {
            const duplicate = await database_1.default.queryOne(`SELECT id FROM tasks 
         WHERE user_id = ? AND name = ? AND id != ?`, [userId, name, id]);
            if (duplicate) {
                res.status(409).json({
                    success: false,
                    message: 'Task with this name already exists'
                });
                return;
            }
        }
        // Build update query
        const updates = [];
        const values = [];
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (settings) {
            if (settings.systemPrompt !== undefined) {
                updates.push('system_prompt = ?');
                values.push(settings.systemPrompt);
            }
            if (settings.taskPrompt !== undefined) {
                updates.push('task_prompt = ?');
                values.push(settings.taskPrompt);
            }
            if (settings.defaultModel !== undefined) {
                updates.push('default_model = ?');
                values.push(settings.defaultModel);
            }
        }
        if (updates.length === 0) {
            res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
            return;
        }
        // Add task ID and user ID to the WHERE clause values
        values.push(id);
        values.push(userId);
        // Execute update
        await database_1.default.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);
        // Fetch updated task
        const updatedTask = await database_1.default.queryOne(`SELECT * FROM tasks WHERE id = ?`, [id]);
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
    }
    catch (error) {
        console.error('❌ [Backend] Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update task',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.updateTask = updateTask;
/**
 * Get all active research groups for the home page directory.
 * Returns only public fields — research key and credentials are never included.
 */
const getResearchGroups = async (_req, res) => {
    try {
        console.log('🏠 [Backend] Fetching research groups for home page');
        const groups = await database_1.default.query(`SELECT u.id, u.username,
              COUNT(t.id) AS task_count
       FROM users u
       LEFT JOIN tasks t ON t.user_id = u.id
       WHERE u.is_active = TRUE AND u.research_key IS NOT NULL
       GROUP BY u.id, u.username
       ORDER BY u.username ASC`, []);
        console.log(`📊 [Backend] Found ${groups.length} research groups`);
        res.status(200).json({
            success: true,
            data: groups.map((g) => ({
                id: g.id,
                name: g.username,
                taskCount: Number(g.task_count)
            }))
        });
    }
    catch (error) {
        console.error('❌ [Backend] Error fetching research groups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch research groups',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getResearchGroups = getResearchGroups;
/**
 * Get tasks by user ID (public endpoint for participant chat URLs).
 * The URL contains the user's UUID — not their secret research key.
 */
const getTasksByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔗 [Backend] Fetching tasks for study userId:', userId);
        // Verify the user exists and is active
        const user = await database_1.default.queryOne(`SELECT id FROM users WHERE id = ? AND is_active = TRUE`, [userId]);
        if (!user) {
            console.log('⚠️ [Backend] User not found for study URL:', userId);
            res.status(404).json({ success: false, message: 'Research group not found' });
            return;
        }
        const tasks = await database_1.default.query(`SELECT * FROM tasks WHERE user_id = ? ORDER BY name ASC`, [userId]);
        console.log(`📊 [Backend] Found ${tasks.length} tasks for userId: ${userId}`);
        const transformedTasks = tasks.map((t) => transformTaskFromDB(t));
        res.status(200).json({
            success: true,
            data: transformedTasks
        });
    }
    catch (error) {
        console.error('❌ [Backend] Error fetching tasks by userId:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getTasksByUserId = getTasksByUserId;
/**
 * Delete a task (soft delete)
 */
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        console.log('🗑️ [Backend] Deleting task:', id);
        // Check if task exists and belongs to user
        const task = await database_1.default.queryOne(`SELECT * FROM tasks 
       WHERE id = ? AND user_id = ?`, [id, userId]);
        if (!task) {
            res.status(404).json({
                success: false,
                message: 'Task not found'
            });
            return;
        }
        // Allow deleting all tasks (user can have 0 tasks)
        // Hard delete (permanently remove from database)
        await database_1.default.query(`DELETE FROM tasks WHERE id = ? AND user_id = ?`, [id, userId]);
        console.log('✅ [Backend] Task permanently deleted from database:', task.name);
        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    }
    catch (error) {
        console.error('❌ [Backend] Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete task',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.deleteTask = deleteTask;
