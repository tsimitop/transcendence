#!/bin/bash

cd /app

npm install -g --verbose typescript@5.8.3

npm ci --verbose

npm run build

exec npm run host