"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSettings = exports.updateSettings = exports.getSettings = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
// In-memory storage for settings (replace with database in production)
const settingsStore = new Map();
const getSettings = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            throw new error_middleware_1.AppError('User ID is required', 400);
        }
        const userSettings = settingsStore.get(userId) || {};
        res.json({
            success: true,
            settings: userSettings
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res, next) => {
    try {
        const { userId, modelName } = req.params;
        const settings = req.body;
        if (!userId || !modelName) {
            throw new error_middleware_1.AppError('User ID and model name are required', 400);
        }
        // Validate settings
        if (!settings.systemPrompt || settings.systemPrompt.trim() === '') {
            throw new error_middleware_1.AppError('System prompt is required', 400);
        }
        // Get or create user settings
        const userSettings = settingsStore.get(userId) || {};
        userSettings[modelName] = settings;
        settingsStore.set(userId, userSettings);
        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: settings
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
const resetSettings = async (req, res, next) => {
    try {
        const { userId, modelName } = req.params;
        if (!userId || !modelName) {
            throw new error_middleware_1.AppError('User ID and model name are required', 400);
        }
        const userSettings = settingsStore.get(userId);
        if (userSettings && userSettings[modelName]) {
            delete userSettings[modelName];
            settingsStore.set(userId, userSettings);
        }
        res.json({
            success: true,
            message: 'Settings reset to defaults'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetSettings = resetSettings;
