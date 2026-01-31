-- ============================================
-- Database Configuration and Setup
-- ============================================

-- This file contains additional configuration and setup queries

-- ============================================
-- Create Database User (for production)
-- ============================================
-- Run these commands as MySQL root user

-- NOTE: The following user/privilege commands require MySQL root privileges
-- and are not allowed on shared hosting (such as OSU's MySQL). They have
-- been removed so this file can be safely imported via phpMyAdmin.
--
-- CREATE USER IF NOT EXISTS 'hai_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER, REFERENCES 
--   ON human_ai_interaction.* TO 'hai_user'@'localhost';
-- GRANT EXECUTE ON human_ai_interaction.* TO 'hai_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- Database Health Check Queries
-- ============================================

-- Check all tables
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size (MB)',
    CREATE_TIME,
    UPDATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'human_ai_interaction'
ORDER BY TABLE_NAME;

-- Check indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    INDEX_TYPE,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'human_ai_interaction'
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE
ORDER BY TABLE_NAME, INDEX_NAME;

-- Check foreign key constraints
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'human_ai_interaction'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================
-- Performance Monitoring Queries
-- ============================================

-- NOTE: The following performance-monitoring queries expect the optional
-- view `view_user_activity` to exist. In shared hosting / partial imports
-- this view may be missing, which causes errors when running this file.
-- They are commented out so the config import succeeds cleanly.
--
-- Most active users
-- SELECT 
--     user_id,
--     username,
--     task_count,
--     conversation_count,
--     message_count,
--     last_activity
-- FROM view_user_activity
-- ORDER BY message_count DESC
-- LIMIT 10;
--
-- Recent conversations
-- SELECT 
--     id,
--     title,
--     ai_model_name,
--     message_count,
--     last_message_at,
--     TIMESTAMPDIFF(MINUTE, last_message_at, NOW()) as minutes_ago
-- FROM conversations
-- ORDER BY last_message_at DESC
-- LIMIT 20;
--
-- Task usage statistics
-- SELECT 
--     name,
--     personality,
--     COUNT(*) as usage_count
-- FROM tasks t
-- LEFT JOIN conversations c ON t.id = c.task_id
-- GROUP BY t.id, name, personality
-- ORDER BY usage_count DESC;

-- ============================================
-- Data Maintenance Queries
-- ============================================

-- Archive old conversations (older than 90 days)
-- CREATE TABLE conversations_archive LIKE conversations;
-- INSERT INTO conversations_archive 
-- SELECT * FROM conversations 
-- WHERE last_message_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Clean up old activity logs (keep only last 30 days)
-- DELETE FROM activity_logs 
-- WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Optimize tables
-- OPTIMIZE TABLE users, tasks, conversations, messages, activity_logs;

-- ============================================
-- Backup Suggestions
-- ============================================

-- Full database backup command (run from terminal):
-- mysqldump -u root -p human_ai_interaction > backup_$(date +%Y%m%d_%H%M%S).sql

-- Backup with compression:
-- mysqldump -u root -p human_ai_interaction | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

-- Restore from backup:
-- mysql -u root -p human_ai_interaction < backup_file.sql

-- ============================================
-- Security Recommendations
-- ============================================

-- 1. Change default admin password immediately
-- UPDATE users SET password_hash = 'your_hashed_password' WHERE username = 'admin';

-- 2. Use strong passwords for database users
-- ALTER USER 'hai_user'@'localhost' IDENTIFIED BY 'very_strong_password_here';

-- 3. Restrict database access by IP if needed
-- CREATE USER 'hai_user'@'192.168.1.100' IDENTIFIED BY 'password';

-- 4. Enable SSL for database connections in production
-- GRANT USAGE ON *.* TO 'hai_user'@'localhost' REQUIRE SSL;

-- 5. Regular security audits
-- SELECT user, host, password_expired, account_locked 
-- FROM mysql.user 
-- WHERE user LIKE 'hai_%';

