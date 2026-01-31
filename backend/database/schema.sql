-- Create and select the database
CREATE DATABASE IF NOT EXISTS human_ai_interaction
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE human_ai_interaction;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    research_key VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_research_key (research_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Tasks Table (with System Configuration)
-- ============================================
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- AI Model Settings
    personality VARCHAR(50) DEFAULT 'friendly',
    response_speed DECIMAL(3,1) DEFAULT 1.0,
    creativity DECIMAL(3,2) DEFAULT 0.7,
    helpfulness DECIMAL(3,2) DEFAULT 0.9,
    verbosity DECIMAL(3,2) DEFAULT 0.6,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INT DEFAULT 1000,
    system_prompt TEXT NOT NULL,
    -- AI-SUGGESTION: MySQL does not allow DEFAULT values on TEXT/BLOB columns.
    -- Store the default prompt in application code or set it explicitly in INSERT statements.
    task_prompt TEXT,

    -- System Configuration Settings (Task-specific)
    llama_base_url VARCHAR(500) DEFAULT 'https://llm-proxy.oai-at.org/',
    llama_service_url VARCHAR(500),
    llama_api_key VARCHAR(500),
    openai_api_key VARCHAR(500),
    anthropic_api_key VARCHAR(500),
    default_model VARCHAR(255),
    auto_update_robot_list BOOLEAN DEFAULT FALSE,

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_name (name),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_user_task_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Conversations Table (Hard deletes only)
-- ============================================
CREATE TABLE conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    task_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    ai_model_name VARCHAR(255),
    ai_model_personality VARCHAR(50),
    ai_model_icon VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Messages Table
-- ============================================
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    sender ENUM('user', 'ai') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- AI Models Table
-- ============================================
CREATE TABLE ai_models (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL UNIQUE,
    model_id VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    status ENUM('available', 'unavailable', 'unknown') DEFAULT 'available',
    description TEXT,
    max_tokens INT DEFAULT 4000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_provider (provider),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Insert Default Data
-- ============================================

-- Insert default user (password: 'admin123' - should be hashed in production)
INSERT INTO users (id, username, email, password_hash, research_key) VALUES
('admin-001', 'admin', 'admin@example.com', '$2a$10$rGF9Z6vJxKJX.LZR3yKzO.8PxZFvXxNQXPwV5yKJXL5R3yKzO.8PxZ', 'research-key-123');

-- Insert default AI models
INSERT INTO ai_models (name, model_id, provider, description, status) VALUES
('Claude V2.1', 'anthropic.claude-v2:1', 'Anthropic', 'Claude 2.1 - Enhanced reasoning and analysis', 'available'),
('Claude V3.5 Sonnet', 'anthropic.claude-3-5-sonnet-20241022-v2:0', 'Anthropic', 'Claude 3.5 Sonnet - Latest version', 'available'),
('Claude V3.7 Sonnet', 'anthropic.claude-3-sonnet-20240229-v1:0', 'Anthropic', 'Claude 3.7 Sonnet - Most recent model', 'available'),
('Claude V3', 'anthropic.claude-v3', 'Anthropic', 'Claude 3 - Base model', 'available'),
('Claude V2', 'anthropic.claude-v2', 'Anthropic', 'Claude 2 - Previous generation', 'available'),
('Meta Llama 3.3B', 'meta.llama3-3b-instruct-v1:0', 'Meta', 'Llama 3 - 3B parameter model', 'available'),
('Meta Llama 3.7B', 'meta.llama3-7b-instruct-v1:0', 'Meta', 'Llama 3 - 7B parameter model', 'available'),
('GPT-3.5 Turbo', 'gpt-3.5-turbo', 'OpenAI', 'GPT-3.5 Turbo - Fast and efficient', 'available'),
('GPT-4', 'gpt-4', 'OpenAI', 'GPT-4 - Most capable OpenAI model', 'available'),
('Amazon Titan Lite', 'amazon.titan-text-lite-v1', 'Amazon', 'Titan Text Lite - Lightweight model', 'available'),
('Amazon Titan Express', 'amazon.titan-text-express-v1', 'Amazon', 'Titan Text Express - Fast responses', 'available'),
('Mistral 7B Instruct', 'mistral.mistral-7b-instruct-v0:2', 'Mistral AI', 'Mistral 7B - Instruction-tuned model', 'available'),
('Mistral 8x7B', 'mistral.mixtral-8x7b-instruct-v0:1', 'Mistral AI', 'Mistral 8x7B - Mixture of experts', 'available'),
('Nova Pro', 'amazon.nova-pro-v1:0', 'Amazon', 'Nova Pro - Advanced reasoning', 'available'),
('Nova Lite', 'amazon.nova-lite-v1:0', 'Amazon', 'Nova Lite - Efficient processing', 'available'),
('Titan Text Embeddings V2', 'amazon.titan-embed-text-v2:0', 'Amazon', 'Text embeddings model', 'available');

-- Insert default tasks for admin user
INSERT INTO tasks (
    id, user_id, name, personality, response_speed, creativity, helpfulness,
    verbosity, temperature, max_tokens, system_prompt, task_prompt,
    llama_base_url, llama_service_url, llama_api_key, openai_api_key,
    anthropic_api_key, default_model, auto_update_robot_list
) VALUES
('task-001', 'admin-001', 'Task 1', 'analytical', 1.0, 0.7, 0.9, 0.6, 0.7, 1000,
 'You are a helpful AI assistant. Be friendly, informative, and engaging in your responses.',
 'Focus on analytical and logical reasoning.',
 'https://llm-proxy.oai-at.org/', '', '', '', '', 'gpt-4o-2024-11-20', FALSE),
('task-002', 'admin-001', 'Task 2', 'creative', 1.0, 0.9, 0.9, 0.7, 0.8, 1500,
 'You are a creative AI assistant. Think outside the box and provide innovative solutions.',
 'Be imaginative and explore different perspectives.',
 'https://llm-proxy.oai-at.org/', '', '', '', '', 'claude-3-5-sonnet-20241022', FALSE),
('task-003', 'admin-001', 'Task 3', 'expert', 1.0, 0.5, 1.0, 0.8, 0.6, 2000,
 'You are an expert AI assistant. Provide authoritative and detailed information.',
 'Focus on accuracy and comprehensive explanations.',
 'https://llm-proxy.oai-at.org/', '', '', '', '', 'gpt-4o-2024-11-20', FALSE),
('task-004', 'admin-001', 'Task 4', 'friendly', 1.0, 0.7, 0.9, 0.6, 0.7, 1000,
 'You are a helpful AI assistant. Be friendly, informative, and engaging in your responses.',
 'Maintain a warm and approachable tone.',
 'https://llm-proxy.oai-at.org/', '', '', '', '', 'nova-pro-v1', FALSE);

-- ============================================
-- Create Views for Common Queries
-- ============================================

-- View: User Tasks with full details including system config
CREATE VIEW view_user_tasks AS
SELECT
    t.id,
    t.user_id,
    t.name,
    t.personality,
    t.response_speed,
    t.creativity,
    t.helpfulness,
    t.verbosity,
    t.temperature,
    t.max_tokens,
    t.system_prompt,
    t.task_prompt,
    t.llama_base_url,
    t.llama_service_url,
    t.llama_api_key,
    t.openai_api_key,
    t.anthropic_api_key,
    t.default_model,
    t.auto_update_robot_list,
    t.is_active,
    t.created_at,
    t.updated_at,
    u.username,
    u.email
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.is_active = TRUE;

-- View: User Activity Summary
CREATE VIEW view_user_activity AS
SELECT
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT t.id) as task_count,
    u.last_login,
    u.created_at as user_since
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id AND t.is_active = TRUE
GROUP BY u.id, u.username, u.email, u.last_login, u.created_at;

-- ============================================
-- Indexes for Performance Optimization
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_tasks_user_active ON tasks(user_id, is_active, created_at);
CREATE INDEX idx_ai_models_provider_status ON ai_models(provider, status, is_active);