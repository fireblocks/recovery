rm -rf node_modules/cache/.turbo
rm -rf node_modules
find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find . -type d -name .next -exec rm -rf {} \;
