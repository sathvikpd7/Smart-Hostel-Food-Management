# Cleanup script
# Remove unnecessary files
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue

# Remove duplicate folders
Remove-Item -Recurse -Force project/src/config/database.ts -ErrorAction SilentlyContinue

# Remove unnecessary files
Remove-Item -Recurse -Force .env -ErrorAction SilentlyContinue

# Install dependencies
npm install
