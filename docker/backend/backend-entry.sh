#!/bin/bash

cd /app

mkdir -p /app/database

# installs the dependencies
npm ci --verbose

# runs the backend
exec npm run dev