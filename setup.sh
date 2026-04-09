#!/bin/bash
set -e
echo "🌿 Stalson Platform — Setup"
echo "================================"

# Install dependencies
echo "📦 Installation des dépendances..."
npm install

# Create .env.local from example
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ .env.local créé — pensez à remplir vos clés Supabase et Anthropic"
fi

# Git setup
echo "🔧 Initialisation Git..."
git init -b main
git add .
git commit -m "feat: initial Stalson Platform MVP"

echo ""
echo "✅ Setup terminé !"
echo ""
echo "Prochaines étapes :"
echo "  1. Remplir .env.local avec vos clés Supabase + Anthropic"
echo "  2. Exécuter les migrations SQL dans Supabase Dashboard"
echo "  3. npm run dev → http://localhost:3000"
echo "  4. git remote add origin <votre-repo-github>"
echo "  5. git push -u origin main"
echo "  6. Importer le repo sur vercel.com"
