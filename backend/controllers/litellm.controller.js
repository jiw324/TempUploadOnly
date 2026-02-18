"use strict";
/**
 * LiteLLM Controller
 * API endpoints for LiteLLM configuration and model management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.liteLLMController = void 0;
const litellm_service_1 = require("../services/litellm.service");
const config_service_1 = require("../services/config.service");
const error_middleware_1 = require("../middleware/error.middleware");
exports.liteLLMController = {
    /**
     * GET /api/litellm/models
     * Get available models from LiteLLM
     */
    async getModels(req, res, next) {
        try {
            void req;
            console.log('📡 [LiteLLM] Fetching available models...');
            const response = await litellm_service_1.liteLLMService.getModelsList();
            if (response.success) {
                console.log(`✅ [LiteLLM] Found ${response.models.length} models`);
                res.json({
                    success: true,
                    models: response.models,
                    count: response.models.length,
                });
            }
            else {
                console.error(`❌ [LiteLLM] Failed to get models: ${response.error}`);
                res.status(500).json({
                    success: false,
                    error: response.error || 'Failed to get model list',
                    models: [],
                });
            }
        }
        catch (error) {
            console.error('❌ [LiteLLM] Error getting models:', error);
            next(new error_middleware_1.AppError(`Failed to get model list: ${error.message}`, 500));
        }
    },
    /**
     * GET /api/litellm/config
     * Get current LiteLLM configuration
     */
    async getConfig(req, res, next) {
        try {
            void req;
            console.log('🔧 [LiteLLM] Fetching configuration...');
            const config = await config_service_1.configService.getLiteLLMConfig();
            // Don't expose API keys in full, show only first few characters
            const sanitizedConfig = {
                apiBaseUrl: config.apiBaseUrl,
                apiKey: config.apiKey ? `${config.apiKey.substring(0, 4)}...` : '',
                openaiKey: config.openaiKey ? `${config.openaiKey.substring(0, 7)}...` : '',
                anthropicKey: config.anthropicKey ? `${config.anthropicKey.substring(0, 7)}...` : '',
                autoUpdateModels: config.autoUpdateModels,
                defaultModel: config.defaultModel,
            };
            console.log('✅ [LiteLLM] Configuration retrieved');
            res.json({
                success: true,
                config: sanitizedConfig,
            });
        }
        catch (error) {
            console.error('❌ [LiteLLM] Error getting config:', error);
            next(new error_middleware_1.AppError(`Failed to get configuration: ${error.message}`, 500));
        }
    },
    /**
     * POST /api/litellm/config
     * Update LiteLLM configuration
     */
    async updateConfig(req, res, next) {
        try {
            const dto = req.body;
            console.log('🔧 [LiteLLM] Updating configuration...');
            // Update configuration
            await config_service_1.configService.updateLiteLLMConfig(dto);
            // Test connection if API base URL was updated
            let connectionTest = null;
            if (dto.apiBaseUrl) {
                console.log('🔌 [LiteLLM] Testing connection to new API base URL...');
                connectionTest = await litellm_service_1.liteLLMService.testConnection();
            }
            console.log('✅ [LiteLLM] Configuration updated successfully');
            res.json({
                success: true,
                message: 'Configuration updated successfully',
                connectionTest,
            });
        }
        catch (error) {
            console.error('❌ [LiteLLM] Error updating config:', error);
            next(new error_middleware_1.AppError(`Failed to update configuration: ${error.message}`, 500));
        }
    },
    /**
     * POST /api/litellm/test-connection
     * Test connection to LiteLLM service
     */
    async testConnection(req, res, next) {
        try {
            void req;
            console.log('🔌 [LiteLLM] Testing connection...');
            const result = await litellm_service_1.liteLLMService.testConnection();
            if (result.success) {
                console.log(`✅ [LiteLLM] Connection successful (${result.models} models available)`);
            }
            else {
                console.error(`❌ [LiteLLM] Connection failed: ${result.message}`);
            }
            res.json(result);
        }
        catch (error) {
            console.error('❌ [LiteLLM] Error testing connection:', error);
            next(new error_middleware_1.AppError(`Connection test failed: ${error.message}`, 500));
        }
    },
};
