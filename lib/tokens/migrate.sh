#!/bin/bash

echo "🚀 Starting Token Migration..."
echo

echo "📋 Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found"
echo

echo "🔧 Installing tsx if needed..."
npm install -g tsx 2>/dev/null

echo
echo "🚀 Running migration script..."
npx tsx migrate-simple.ts

echo
echo "✅ Migration completed!"
echo
echo "📋 Next steps:"
echo "  1. Review the generated files"
echo "  2. Run: npx tsc --noEmit"
echo "  3. Test your application"
echo "  4. Delete the old lib/tokens.ts file when ready"
echo
