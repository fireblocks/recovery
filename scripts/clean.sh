rm -rf node_modules/cache/.turbo
rm -rf node_modules
find . -type d -name dist -not -path './node_modules/*' -exec rm -rf {} \;
find . -type d -name .next -exec rm -rf {} \;

yarn install
