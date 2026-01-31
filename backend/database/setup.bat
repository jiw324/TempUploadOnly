@echo off
REM ============================================
REM Database Setup Script for Human AI Interaction (Windows)
REM ============================================

echo ============================================
echo Human AI Interaction - Database Setup
echo ============================================
echo.

REM AI-SUGGESTION: Prefer an explicit mysql.exe path so the script works even if MySQL isn't on PATH.
set "MYSQL_BIN=mysql.exe"
where mysql.exe >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    )
)

REM Check if MySQL is installed
where "%MYSQL_BIN%" >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MySQL is not installed!
    echo Please install MySQL first from: https://dev.mysql.com/downloads/mysql/
    pause
    exit /b 1
)

echo [OK] MySQL is installed
echo.

REM Prompt for MySQL credentials
set /p DB_USER="MySQL Username [root]: "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASSWORD="MySQL Password: "
echo.

REM Test MySQL connection
echo Testing MySQL connection...
"%MYSQL_BIN%" -u%DB_USER% -p%DB_PASSWORD% -e "SELECT VERSION();" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to connect to MySQL!
    echo Please check your credentials and try again.
    pause
    exit /b 1
)

echo [OK] MySQL connection successful
echo.

REM AI-SUGGESTION: Create/select database explicitly since schema.sql has CREATE DATABASE/USE commented out.
echo Ensuring database exists...
"%MYSQL_BIN%" -u%DB_USER% -p%DB_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS human_ai_interaction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create database human_ai_interaction
    pause
    exit /b 1
)

REM Import schema into the target database
echo Importing schema into human_ai_interaction...
"%MYSQL_BIN%" -u%DB_USER% -p%DB_PASSWORD% --database=human_ai_interaction < schema.sql
if %errorlevel% equ 0 (
    echo [OK] Database created successfully!
) else (
    echo [ERROR] Failed to create database
    pause
    exit /b 1
)

echo.
echo Creating database user (optional)...
set /p CREATE_USER="Create dedicated database user? (y/N): "

if /i "%CREATE_USER%"=="y" (
    set /p NEW_USER="New database username [hai_user]: "
    if "%NEW_USER%"=="" set NEW_USER=hai_user
    
    set /p NEW_PASSWORD="New database password: "
    
    echo CREATE USER IF NOT EXISTS '%NEW_USER%'@'localhost' IDENTIFIED BY '%NEW_PASSWORD%'; > temp_user.sql
    echo GRANT ALL PRIVILEGES ON human_ai_interaction.* TO '%NEW_USER%'@'localhost'; >> temp_user.sql
    echo FLUSH PRIVILEGES; >> temp_user.sql
    
    "%MYSQL_BIN%" -u%DB_USER% -p%DB_PASSWORD% < temp_user.sql
    del temp_user.sql
    
    echo [OK] Database user created
    echo.
    
    REM Create .env file
    echo Creating .env file...
    (
        echo PORT=3001
        echo NODE_ENV=development
        echo JWT_SECRET=your-secret-key-change-this-in-production
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo DB_NAME=human_ai_interaction
        echo DB_USER=%NEW_USER%
        echo DB_PASSWORD=%NEW_PASSWORD%
        echo CORS_ORIGIN=http://localhost:5173
        echo RESEARCH_KEY=research-key-123
    ) > ..\.env
    
    echo [OK] .env file created
) else (
    REM Create .env with root user
    (
        echo PORT=3001
        echo NODE_ENV=development
        echo JWT_SECRET=your-secret-key-change-this-in-production
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo DB_NAME=human_ai_interaction
        echo DB_USER=%DB_USER%
        echo DB_PASSWORD=%DB_PASSWORD%
        echo CORS_ORIGIN=http://localhost:5173
        echo RESEARCH_KEY=research-key-123
    ) > ..\.env
    
    echo [WARNING] Using root user (not recommended for production)
)

echo.
echo ============================================
echo [OK] Database setup complete!
echo ============================================
echo.
echo Database Information:
echo   - Database: human_ai_interaction
echo   - Tables: 8 (users, tasks, conversations, messages, etc.)
echo   - Views: 3
echo   - Stored Procedures: 4
echo   - Default Data: 1 admin user, 4 tasks, 16 AI models
echo.
echo Default Admin Credentials:
echo   - Username: admin
echo   - Email: admin@example.com
echo   - Password: admin123
echo   - Research Key: research-key-123
echo.
echo [WARNING] Remember to change the admin password!
echo.
echo Next steps:
echo   1. cd ..
echo   2. npm install mysql2
echo   3. npm run dev
echo.
pause

