#!/bin/bash

cd /app

# this should be in the Dockerfile, but it's not working?
npm install -g --verbose typescript@5.8.3

npm ci --verbose

npm run build

exec npm run host