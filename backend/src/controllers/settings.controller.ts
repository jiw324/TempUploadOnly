import { Request, Response, NextFunction } from 'express';
import { AISettings } from '../types';
import { AppError } from '../middleware/error.middleware';

// In-memory storage for settings (replace with database in production)
const settingsStore: Map<string, Record<string, AISettings>> = new Map();

export const getSettings = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const userSettings = settingsStore.get(userId) || {};

    res.json({
      success: true,
      settings: userSettings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: Request<{ userId: string; modelName: string }, {}, AISettings>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, modelName } = req.params;
    const settings = req.body;

    if (!userId || !modelName) {
      throw new AppError('User ID and model name are required', 400);
    }

    // Validate settings
    if (settings.creativity < 0 || settings.creativity > 100) {
      throw new AppError('Creativity must be between 0 and 100', 400);
    }

    if (settings.temperature < 0 || settings.temperature > 2) {
      throw new AppError('Temperature must be between 0 and 2', 400);
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
  } catch (error) {
    next(error);
  }
};

export const resetSettings = async (
  req: Request<{ userId: string; modelName: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, modelName } = req.params;

    if (!userId || !modelName) {
      throw new AppError('User ID and model name are required', 400);
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
  } catch (error) {
    next(error);
  }
};

