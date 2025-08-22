@echo off
echo 🚀 Starting Token Migration...
echo.

echo 📋 Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo 🔧 Installing tsx if needed...
npm install -g tsx 2>nul

echo.
echo 🚀 Running migration script...
npx tsx migrate-simple.ts

echo.
echo ✅ Migration completed!
echo.
echo 📋 Next steps:
echo   1. Review the generated files
echo   2. Run: npx tsc --noEmit
echo   3. Test your application
echo   4. Delete the old lib/tokens.ts file when ready
echo.
pause
