# PowerShell script to remove .env files from git history
# WARNING: This rewrites git history. Coordinate with your team before running!

Write-Host "⚠️  WARNING: This will rewrite git history!" -ForegroundColor Red
Write-Host "⚠️  All team members will need to re-clone the repository." -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔄 Removing .env files from git history..." -ForegroundColor Cyan
Write-Host ""

# Remove .env files from all commits
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch wans-backend/.env .env wans-backend/.env.local .env.local .env.production wans-backend/.env.production" `
  --prune-empty --tag-name-filter cat -- --all

Write-Host ""
Write-Host "✅ .env files removed from git history" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Force push to remote: git push origin --force --all"
Write-Host "2. Force push tags: git push origin --force --tags"
Write-Host "3. Notify all team members to re-clone the repository"
Write-Host "4. Clean up local refs: Remove-Item -Recurse -Force .git/refs/original/"
Write-Host "5. Run garbage collection: git reflog expire --expire=now --all; git gc --prune=now --aggressive"
Write-Host ""
Write-Host "⚠️  IMPORTANT: All team members must delete their local clones and re-clone!" -ForegroundColor Red
