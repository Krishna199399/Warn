#!/bin/bash

# Script to remove .env files from git history
# WARNING: This rewrites git history. Coordinate with your team before running!

echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  All team members will need to re-clone the repository."
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🔄 Removing .env files from git history..."
echo ""

# Remove .env files from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch wans-backend/.env .env wans-backend/.env.local .env.local .env.production wans-backend/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "✅ .env files removed from git history"
echo ""
echo "📝 Next steps:"
echo "1. Force push to remote: git push origin --force --all"
echo "2. Force push tags: git push origin --force --tags"
echo "3. Notify all team members to re-clone the repository"
echo "4. Clean up local refs: rm -rf .git/refs/original/"
echo "5. Run garbage collection: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
echo ""
echo "⚠️  IMPORTANT: All team members must delete their local clones and re-clone!"
