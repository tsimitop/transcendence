#!/bin/bash

cd /app

mkdir -p /app/database

npm ci --verbose

exec npm run dev