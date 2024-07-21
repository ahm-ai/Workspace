npx nodemon \
  --watch "src" \
  --watch "extension" \
  --ignore "extension/dist" \
  --ignore "node_modules" \
  --ext "js,jsx,json,html,css" \
  --exec "yarn build && echo 'Build completed'" \
  --verbose