#!/bin/bash

# ============================================
# Database Setup Script for Human AI Interaction
# ============================================

echo "🚀 Human AI Interaction - Database Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL is not installed!${NC}"
    echo "Please install MySQL first:"
    echo "  macOS:   brew install mysql"
    echo "  Ubuntu:  sudo apt-get install mysql-server"
    echo "  Windows: Download from https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

echo -e "${GREEN}✅ MySQL is installed${NC}"
echo ""

# Prompt for MySQL credentials
echo "Please enter your MySQL credentials:"
read -p "MySQL Username [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "MySQL Password: " DB_PASSWORD
echo ""
echo ""

# Test MySQL connection
echo "🔍 Testing MySQL connection..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT VERSION();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to connect to MySQL!${NC}"
    echo "Please check your credentials and try again."
    exit 1
fi

echo -e "${GREEN}✅ MySQL connection successful${NC}"
echo ""

# AI-SUGGESTION: Create/select database explicitly since schema.sql has CREATE DATABASE/USE commented out.
echo "📦 Ensuring database exists..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS human_ai_interaction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create database human_ai_interaction${NC}"
    exit 1
fi

# Import schema into the target database
echo "📦 Importing schema into human_ai_interaction..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" --database=human_ai_interaction < schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created successfully!${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi

echo ""
echo "🔐 Creating database user (optional)..."
read -p "Create dedicated database user? (y/N): " CREATE_USER

if [[ $CREATE_USER =~ ^[Yy]$ ]]; then
    read -p "New database username [hai_user]: " NEW_USER
    NEW_USER=${NEW_USER:-hai_user}
    
    read -sp "New database password: " NEW_PASSWORD
    echo ""
    
    mysql -u"$DB_USER" -p"$DB_PASSWORD" <<EOF
CREATE USER IF NOT EXISTS '${NEW_USER}'@'localhost' IDENTIFIED BY '${NEW_PASSWORD}';
GRANT ALL PRIVILEGES ON human_ai_interaction.* TO '${NEW_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    echo -e "${GREEN}✅ Database user created${NC}"
    
    # Update .env file
    echo ""
    echo "📝 Updating .env file..."
    if [ -f "../.env" ]; then
        cp ../.env ../.env.backup
        echo "Backup created: .env.backup"
    fi
    
    cat > ../.env <<EOF
PORT=3001
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-key")
DB_HOST=localhost
DB_PORT=3306
DB_NAME=human_ai_interaction
DB_USER=${NEW_USER}
DB_PASSWORD=${NEW_PASSWORD}
CORS_ORIGIN=http://localhost:5173
RESEARCH_KEY=research-key-123
EOF
    
    echo -e "${GREEN}✅ .env file created${NC}"
else
    # Create .env with root user
    cat > ../.env <<EOF
PORT=3001
NODE_ENV=development
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-key")
DB_HOST=localhost
DB_PORT=3306
DB_NAME=human_ai_interaction
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
CORS_ORIGIN=http://localhost:5173
RESEARCH_KEY=research-key-123
EOF
    
    echo -e "${YELLOW}⚠️  Using root user (not recommended for production)${NC}"
fi

echo ""
echo "============================================"
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo "============================================"
echo ""
echo "📊 Database Information:"
echo "  - Database: human_ai_interaction"
echo "  - Tables: 8 (users, tasks, conversations, messages, etc.)"
echo "  - Views: 3"
echo "  - Stored Procedures: 4"
echo "  - Default Data: 1 admin user, 4 tasks, 16 AI models"
echo ""
echo "🔐 Default Admin Credentials:"
echo "  - Username: admin"
echo "  - Email: admin@example.com"
echo "  - Password: admin123"
echo "  - Research Key: research-key-123"
echo ""
echo -e "${YELLOW}⚠️  Remember to change the admin password!${NC}"
echo ""
echo "Next steps:"
echo "  1. cd .."
echo "  2. npm install mysql2"
echo "  3. npm run dev"
echo ""

