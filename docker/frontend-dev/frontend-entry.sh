#!/bin/bash

cd /app

npm ci --verbose

npm run build

# just exit again after the build has finished.
# Now caddy can take the files and serve them.
echo "Frontend build finished."
exec npm run host
