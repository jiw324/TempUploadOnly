# Database Quick Start Guide

## 🚀 Fast Setup (5 minutes)

### Step 1: Install MySQL (if not installed)

**Windows:**
- Download from: https://dev.mysql.com/downloads/mysql/
- Run installer and set root password

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

### Step 2: Run Setup Script

**Windows (PowerShell or CMD):**
```bash
cd backend\database
setup.bat
```

**macOS/Linux:**
```bash
cd backend/database
chmod +x setup.sh
./setup.sh
```

**Manual Setup:**
```bash
# Login to MySQL
mysql -u root -p

# Run schema file
source schema.sql

# Exit MySQL
exit
```

### Step 3: Install MySQL Driver

```bash
cd backend
npm install mysql2
```

### Step 4: Configure Environment

Create `backend/.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=human_ai_interaction
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your-secret-key
PORT=3001
```

### Step 5: Test Connection

```bash
cd backend
npm run dev
```

Look for: `✅ Database connected successfully`

---

## 📝 Default Credentials

**Login to Application:**
- Research Key: `research-key-123`

**Admin User (in database):**
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin123`

---

## 🗄️ Database Structure

**4 Core Tables:**
1. `users` - User accounts & authentication
2. `tasks` - AI task configurations
3. `ai_models` - Available AI models (16 pre-loaded)
4. `system_config` - User settings

**Note:** Conversations, messages, sessions, and activity logs will be added when those features are implemented.

**2 Views:**
- `view_user_tasks` - Tasks with user details
- `view_user_activity` - User activity summary

**3 Stored Procedures:**
- `sp_get_user_tasks()` - Get tasks for a user
- `sp_get_models_by_provider()` - Get AI models by provider
- `sp_get_user_config()` - Get user configuration

---

## 🔍 Common Database Queries

### Check if database exists
```sql
SHOW DATABASES LIKE 'human_ai_interaction';
```

### View all tables
```sql
USE human_ai_interaction;
SHOW TABLES;
```

### Check default data
```sql
SELECT * FROM users;
SELECT id, name, personality FROM tasks;
SELECT COUNT(*) FROM ai_models;
```

### View user tasks
```sql
SELECT * FROM view_user_tasks WHERE user_id = 'admin-001';
```

### Get all tasks for a user
```sql
CALL sp_get_user_tasks('admin-001');
```

---

## 🔧 Common Issues & Solutions

### Issue: "Access denied for user"
```bash
# Reset MySQL root password
mysql -u root --skip-password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Issue: "Database does not exist"
```bash
# Recreate database
mysql -u root -p < backend/database/schema.sql
```

### Issue: "Connection refused"
```bash
# Check if MySQL is running
# Windows:
net start | find "MySQL"

# macOS:
brew services list

# Linux:
sudo systemctl status mysql
```

### Issue: "Package mysql2 not found"
```bash
cd backend
npm install mysql2
```

---

## 🧪 Test Database Connection

Create a test file `backend/test-db.js`:

```javascript
const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'your_password',
      database: 'human_ai_interaction'
    });
    
    console.log('✅ Connected to database');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM tasks');
    console.log(`📊 Found ${rows[0].count} tasks`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
```

Run: `node backend/test-db.js`

---

## 📦 Backup & Restore

### Backup
```bash
mysqldump -u root -p human_ai_interaction > backup.sql
```

### Restore
```bash
mysql -u root -p human_ai_interaction < backup.sql
```

---

## 🎯 Next Steps

1. ✅ Database installed and running
2. ✅ Schema created with default data
3. ✅ MySQL driver installed
4. ✅ .env file configured
5. ⏭️ Update backend controllers to use database
6. ⏭️ Test API endpoints with database
7. ⏭️ Migrate from mock data to real database

---

## 📞 Need Help?

- Check backend console for error messages
- Review MySQL error log
- Verify .env database credentials
- Ensure MySQL service is running
- Check firewall settings

**Database location:** `C:\ProgramData\MySQL\` (Windows) or `/usr/local/mysql/` (macOS/Linux)

