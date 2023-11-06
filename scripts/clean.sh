rm -rf node_modules/cache/.turbo
find . -type d -name dist -not -path './node_modules/*' -exec rm -rf {} \;
