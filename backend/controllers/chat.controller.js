"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamMessage = exports.sendMessage = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const uuid_1 = require("uuid");
const litellm_service_1 = require("../services/litellm.service");
/**
 * Generate AI response using LiteLLM service
 *
 * Flow:
 * 1. System Prompt: Sets the AI's behavior and personality (from task settings)
 * 2. Task Prompt: Displayed as initial greeting to user (shown in chat UI)
 * 3. Conversation History: Previous messages for context
 * 4. User Message: Current user input
 *
 * The System Prompt instructs the AI on HOW to respond
 * The Task Prompt tells the USER what the task is about
 */
const generateAIResponse = async (userMessage, settings, messageHistory) => {
    try {
        // Mark as used to satisfy TypeScript when compile options are strict
        // (left in signature for future extensibility)
        // void aiModel;
        console.log(`🤖 [Chat] Generating AI response using ${settings?.defaultModel || 'default model'}...`);
        // Build message history for LiteLLM in the correct format
        const messages = [];
        // Some providers on Bedrock (e.g. DeepSeek, AWS Nova) require conversations
        // to start with a user message – they do not allow a system message as the
        // first role.
        const modelId = (settings?.defaultModel || '').toLowerCase();
        const requiresUserFirst = modelId.includes('deepseek') || // DeepSeek on Bedrock
            modelId.includes('nova') || // AWS Nova models
            modelId.includes('llama3'); // Llama 3 models on Bedrock
        // 1. Add System Prompt - This sets the AI's behavior and personality
        // Example: "You are a helpful AI assistant. Be friendly, informative, and engaging."
        // For models that must start with a user message, we will NOT send a separate
        // system role; instead we'll prepend the system prompt to the first user message.
        const systemPrompt = settings?.systemPrompt;
        if (systemPrompt && !requiresUserFirst) {
            console.log(`📋 [Chat] Using System Prompt: "${systemPrompt.substring(0, 50)}..."`);
            messages.push({
                role: 'system',
                content: systemPrompt,
            });
        }
        // Add conversation history (last 10 messages for context)
        let hasUserMessage = false;
        let hasPrependedSystemToFirstUser = false;
        if (messageHistory && messageHistory.length > 0) {
            const recentHistory = messageHistory.slice(-10);
            for (let i = 0; i < recentHistory.length; i++) {
                const msg = recentHistory[i];
                if (msg.sender === 'user') {
                    let content = msg.text;
                    // For models that must start with a user message, prepend system prompt
                    // to the very first user message we send.
                    if (requiresUserFirst && systemPrompt && !hasPrependedSystemToFirstUser && !hasUserMessage) {
                        content = `[System Instructions: ${systemPrompt}]\n\n${msg.text}`;
                        hasPrependedSystemToFirstUser = true;
                        console.log(`📋 [Chat] Prepending System Prompt to first user history message for model ${settings.defaultModel}`);
                    }
                    messages.push({
                        role: 'user',
                        content,
                    });
                    hasUserMessage = true;
                }
                else if (msg.sender === 'ai') {
                    // For requiresUserFirst models, skip assistant messages that would
                    // appear before any user message.
                    if (requiresUserFirst && !hasUserMessage) {
                        continue;
                    }
                    messages.push({
                        role: 'assistant',
                        content: msg.text,
                    });
                }
            }
        }
        // Add current user message
        let currentUserContent = userMessage;
        // If there was no prior user message in history for a requiresUserFirst model,
        // prepend the system prompt to the current user message.
        if (requiresUserFirst && systemPrompt && !hasUserMessage) {
            currentUserContent = `[System Instructions: ${systemPrompt}]\n\n${userMessage}`;
            console.log(`📋 [Chat] Prepending System Prompt to current user message for model ${settings.defaultModel}`);
        }
        messages.push({
            role: 'user',
            content: currentUserContent,
        });
        console.log(`📝 [Chat] Message history: ${messages.length} messages`);
        // Call LiteLLM service with default parameters
        // Use sensible defaults for parameters not in simplified task structure
        const response = await litellm_service_1.liteLLMService.sendChatCompletion(messages, settings?.defaultModel, 0.7, // temperature - balanced creativity
        2000, // maxTokens - reasonable response length
        0.9, // topP - nucleus sampling
        0, // presencePenalty - no penalty
        0 // frequencyPenalty - no penalty
        );
        if (response.success && response.data?.choices?.[0]?.message?.content) {
            const aiMessage = response.data.choices[0].message.content;
            console.log(`✅ [Chat] AI response generated (${aiMessage.length} characters)`);
            return aiMessage;
        }
        else {
            console.error(`❌ [Chat] LiteLLM failed: ${response.error}`);
            throw new Error(response.error || 'Failed to generate AI response');
        }
    }
    catch (error) {
        console.error('❌ [Chat] Error generating AI response:', error);
        // Fallback to a simple response
        console.log('⚠️ [Chat] Using fallback response due to LiteLLM error');
        return `I apologize, but I'm having trouble connecting to the AI service right now. Error: ${error.message}. Please check your LiteLLM configuration or try again later.`;
    }
};
const sendMessage = async (req, res, next) => {
    try {
        const { message, conversationId, aiModel, settings, messageHistory } = req.body;
        if (!message || !message.trim()) {
            throw new error_middleware_1.AppError('Message is required', 400);
        }
        if (!conversationId) {
            throw new error_middleware_1.AppError('Conversation ID is required', 400);
        }
        if (!aiModel) {
            throw new error_middleware_1.AppError('AI Model is required', 400);
        }
        console.log(`💬 [Chat] Processing message for conversation: ${conversationId}`);
        // Generate AI response using LiteLLM
        const aiResponseText = await generateAIResponse(message, settings, messageHistory);
        // Create response message
        const responseMessage = {
            id: (0, uuid_1.v4)(),
            text: aiResponseText,
            sender: 'ai',
            timestamp: new Date()
        };
        console.log(`✅ [Chat] Response sent successfully`);
        res.json({
            success: true,
            response: responseMessage
        });
    }
    catch (error) {
        console.error('❌ [Chat] Error in sendMessage:', error);
        next(error);
    }
};
exports.sendMessage = sendMessage;
const streamMessage = async (req, res, next) => {
    try {
        const { message, aiModel, settings, messageHistory } = req.body;
        void aiModel;
        if (!message || !message.trim()) {
            throw new error_middleware_1.AppError('Message is required', 400);
        }
        console.log(`📡 [Chat] Streaming message...`);
        // Set up SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Generate response using LiteLLM
        const aiResponseText = await generateAIResponse(message, settings, messageHistory);
        // Stream response word by word
        const words = aiResponseText.split(' ');
        for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 50)); // Delay between words
        }
        // Send completion signal
        res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
        res.end();
        console.log(`✅ [Chat] Streaming completed`);
    }
    catch (error) {
        console.error('❌ [Chat] Error in streamMessage:', error);
        next(error);
    }
};
exports.streamMessage = streamMessage;
