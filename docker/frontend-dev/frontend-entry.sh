#!/bin/bash

cd /app

# npm install -g --verbose typescript@5.8.3

npm ci --verbose

npm run build

# just exit again after the build has finished.
# Now caddy can take the files and serve them.
echo "Frontend build finished. Start caddy server now. "
# exec npm run host
