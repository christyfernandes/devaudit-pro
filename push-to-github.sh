#!/usr/bin/env bash
# push-to-github.sh
# Run this script from the devaudit-pro directory to create the GitHub repo and push.
# Usage:  bash push-to-github.sh <YOUR_GITHUB_TOKEN>

set -e

TOKEN="${1:-}"
GITHUB_USER="christyfernandes"
REPO_NAME="devaudit-pro"

if [ -z "$TOKEN" ]; then
  echo "❌  Usage: bash push-to-github.sh <YOUR_GITHUB_TOKEN>"
  echo ""
  echo "   Get a token at: https://github.com/settings/tokens"
  echo "   Required scopes: repo (full control)"
  exit 1
fi

echo "🚀  Creating GitHub repo ${GITHUB_USER}/${REPO_NAME}..."

HTTP_STATUS=$(curl -s -o /tmp/gh_create_response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"${REPO_NAME}\",
    \"description\": \"Frontend Code Compliance & Best Practices Auditor — Angular 17+ PWA built from the Frontend CoE Review Checklist v2.0\",
    \"homepage\": \"https://${GITHUB_USER}.github.io/${REPO_NAME}/\",
    \"private\": false,
    \"has_issues\": true,
    \"has_projects\": false,
    \"has_wiki\": false,
    \"auto_init\": false
  }")

if [ "$HTTP_STATUS" = "201" ]; then
  echo "✅  Repo created: https://github.com/${GITHUB_USER}/${REPO_NAME}"
elif [ "$HTTP_STATUS" = "422" ]; then
  echo "ℹ️   Repo already exists — continuing with push."
else
  echo "❌  Failed to create repo (HTTP $HTTP_STATUS):"
  cat /tmp/gh_create_response.json
  exit 1
fi

echo ""
echo "📤  Setting remote and pushing..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
git push -u origin main

echo ""
echo "✅  All done!"
echo ""
echo "   Repo:        https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "   Live (after CI): https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo ""
echo "   ⚙️  Enable GitHub Pages:"
echo "      1. Go to https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/pages"
echo "      2. Source → GitHub Actions"
echo "      3. The workflow will auto-deploy on every push to main"
