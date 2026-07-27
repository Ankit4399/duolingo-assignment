#!/usr/bin/env bash
# Render Build Script for Backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Seed the database on first deploy
python -m app.database.seed

