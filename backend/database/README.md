# Database Setup Guide

This directory contains the MySQL database schema and configuration files for the Human AI Interaction application.

## 📁 Files

- **schema.sql** - Complete database schema with tables, views, stored procedures, triggers, and default data
- **config.sql** - Database configuration, user management, and maintenance queries
- **README.md** - This file with setup instructions

## 🚀 Quick Start

### Prerequisites

1. MySQL 8.0 or higher installed
2. MySQL server running
3. MySQL root access

### Installation Steps

#### 1. Install MySQL (if not already installed)

**Windows:**
```bash
# Download and install from: https://dev.mysql.com/downloads/mysql/
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install mysql-server
sudo systemctl start mysql
```

#### 2. Create the Database

**Option A: Using MySQL Command Line**
```bash
# Login to MySQL as root
mysql -u root -p

# Run the schema file
source backend/database/schema.sql

# Or from outside MySQL:
mysql -u root -p < backend/database/schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open `schema.sql` file
4. Execute the script (Lightning bolt icon)

**Option C: One-command setup (Windows/macOS/Linux)**
- Windows: run `backend/database/setup.bat`
- macOS/Linux: run `backend/database/setup.sh`
- See `backend/database/WORKBENCH_SETUP.md` for a quick walkthrough.

#### 3. Configure Database User (Production)

```bash
# Login as root
mysql -u root -p

# Run configuration
source backend/database/config.sql

# Or manually create user:
CREATE USER 'hai_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON human_ai_interaction.* TO 'hai_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 4. Configure Backend Connection

Create or update `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=human_ai_interaction
DB_USER=hai_user
DB_PASSWORD=your_secure_password

# For development (using root)
# DB_USER=root
# DB_PASSWORD=your_root_password
```

#### 5. Verify Installation

```sql
-- Login to MySQL
mysql -u root -p

-- Switch to database
USE human_ai_interaction;

-- Check tables
SHOW TABLES;

-- Verify default data
SELECT * FROM users;
SELECT * FROM tasks;
SELECT * FROM ai_models;

-- Check views
SELECT * FROM view_user_tasks;
```

## 📊 Database Schema Overview

### Tables (Core Only - 4 Tables)

1. **users** - User accounts and authentication
2. **tasks** - AI task configurations with settings
3. **ai_models** - Available AI models catalog
4. **system_config** - User-specific system configuration

**Note:** Conversations, messages, session tokens, and activity logs will be added when those features are implemented.

### Views

- **view_user_tasks** - User tasks with full details
- **view_user_activity** - User activity summary

### Stored Procedures

- **sp_get_user_tasks** - Retrieve user's tasks
- **sp_get_models_by_provider** - Get AI models by provider
- **sp_get_user_config** - Get user configuration settings

## 🔐 Default Credentials

**Admin User:**
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123` (⚠️ **Change immediately in production!**)
- Research Key: `research-key-123`

**Database User (Production):**
- Username: `hai_user`
- Password: Set during configuration

## 🗃️ Sample Data

The schema includes:
- 1 admin user
- 4 default tasks (Task 1-4 with different personalities)
- 16 AI models (Claude, GPT, Llama, Mistral, Titan, Nova)
- Empty system_config table (ready for user configurations)

## 🛠️ Maintenance

### Backup Database

```bash
# Full backup
mysqldump -u root -p human_ai_interaction > backup_$(date +%Y%m%d).sql

# Compressed backup
mysqldump -u root -p human_ai_interaction | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup specific tables
mysqldump -u root -p human_ai_interaction users tasks > backup_users_tasks.sql
```

### Restore Database

```bash
# Restore from backup
mysql -u root -p human_ai_interaction < backup_file.sql

# Restore compressed backup
gunzip < backup_file.sql.gz | mysql -u root -p human_ai_interaction
```

### Optimize Performance

```sql
-- Analyze tables
ANALYZE TABLE users, tasks, conversations, messages;

-- Optimize tables
OPTIMIZE TABLE users, tasks, conversations, messages;

-- Check table status
SHOW TABLE STATUS FROM human_ai_interaction;
```

### Clean Old Data

```sql
-- Delete old activity logs (older than 30 days)
DELETE FROM activity_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Delete expired sessions
CALL sp_cleanup_expired_sessions();
```

## 🔍 Useful Queries

### User Statistics
```sql
SELECT * FROM view_user_activity;
```

### Recent Activity
```sql
SELECT * FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### Conversation History
```sql
SELECT 
    c.title,
    c.ai_model_name,
    COUNT(m.id) as message_count,
    c.last_message_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id
ORDER BY c.last_message_at DESC;
```

### Task Usage
```sql
SELECT 
    t.name,
    t.personality,
    COUNT(c.id) as conversation_count
FROM tasks t
LEFT JOIN conversations c ON t.id = c.task_id
GROUP BY t.id
ORDER BY conversation_count DESC;
```

## 🚨 Troubleshooting

### Connection Issues

```bash
# Check MySQL service status
# Windows:
net start | find "MySQL"

# macOS/Linux:
sudo systemctl status mysql
# or
brew services list | grep mysql
```

### Permission Errors

```sql
-- Check user privileges
SHOW GRANTS FOR 'hai_user'@'localhost';

-- Grant missing privileges
GRANT ALL PRIVILEGES ON human_ai_interaction.* TO 'hai_user'@'localhost';
FLUSH PRIVILEGES;
```

### Reset Database

```bash
# Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS human_ai_interaction;"
mysql -u root -p < backend/database/schema.sql
```

## 📈 Migration from Mock Data

The backend currently uses mock data in `task.controller.ts`. To migrate to MySQL:

1. ✅ Complete database setup (this guide)
2. Install MySQL driver: `npm install mysql2`
3. Update controller files to use database queries
4. Test connections
5. Migrate existing localStorage data if needed

## 🔒 Security Best Practices

1. **Change default passwords immediately**
2. Use strong passwords for database users
3. Restrict database access by IP in production
4. Enable SSL for database connections
5. Regular backups (automated)
6. Keep MySQL updated
7. Use prepared statements to prevent SQL injection
8. Encrypt sensitive data at rest
9. Regular security audits
10. Limit user privileges to minimum required

## 📞 Support

For issues or questions:
- Check MySQL error logs
- Review backend logs
- Verify connection settings in .env
- Ensure MySQL service is running
- Check firewall settings

## 📝 License

This database schema is part of the Human AI Interaction project.

