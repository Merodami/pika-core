#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Determine the script's own directory ---
SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"
# SCRIPT_DIR will be the absolute path to 'packages/tests/src/scripts'

# --- Configuration ---
# Define the output path for the final init.sql file
# It should be: packages/tests/src/utils/dump/init.sql
# Relative to SCRIPT_DIR: ../utils/dump
INIT_SQL_DIR="$SCRIPT_DIR/../utils/dump"
INIT_SQL_FILE="$INIT_SQL_DIR/init.sql"
TEMP_INIT_SQL_FILE="$INIT_SQL_DIR/init.sql.tmp" # Temporary file for pg_dump output

echo "🔄 Starting test database dump generation..."
echo "   Script executing from: $SCRIPT_DIR"
echo "   Target output directory: $INIT_SQL_DIR"
echo "   Target final init.sql file: $INIT_SQL_FILE"
echo "   Temporary dump file: $TEMP_INIT_SQL_FILE"

# Ensure the output directory exists
mkdir -p "$INIT_SQL_DIR"
echo "   Ensured directory exists: $INIT_SQL_DIR"

# --- Check for DATABASE_URL ---
if [ -z "$DATABASE_URL" ]; then
  echo "🔴 ERROR: DATABASE_URL environment variable is not set."
  echo "   This script should be called via 'yarn db:generate-test-dump' which uses dotenv-cli."
  exit 1
fi
echo "   Using DATABASE_URL from environment."

# --- Generate the schema-only dump into a temporary file ---
echo "   1. Running pg_dump (schema-only) to $TEMP_INIT_SQL_FILE..."

# Try using Docker with matching PostgreSQL version to avoid version mismatch
if command -v docker &> /dev/null; then
  echo "   Using Docker with PostgreSQL 17 to avoid version mismatch..."
  echo "   DATABASE_URL: $DATABASE_URL"
  echo "   Running pg_dump in container and outputting to stdout..."
  
  # Run pg_dump and capture output directly, then write to file
  docker run --rm --network host \
    postgres:17.2 pg_dump \
    --schema-only \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    -d "$DATABASE_URL" > "$TEMP_INIT_SQL_FILE" || {
      echo "🔴 ERROR: Docker pg_dump failed with exit code $?"
      echo "   Checking if we can write to target directory..."
      ls -la "$INIT_SQL_DIR" || echo "   Directory not accessible"
      exit 1
    }
else
  # Fallback to local pg_dump
  echo "   Docker not available, using local pg_dump..."
  pg_dump \
    --schema-only \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --file="$TEMP_INIT_SQL_FILE" \
    -d "$DATABASE_URL"
fi
echo "   pg_dump completed. Exit code: $?"

if [ ! -f "$TEMP_INIT_SQL_FILE" ]; then
    echo "🔴 ERROR: pg_dump did not create the temporary file: $TEMP_INIT_SQL_FILE"
    exit 1
elif [ ! -s "$TEMP_INIT_SQL_FILE" ]; then
    echo "⚠️ WARNING: pg_dump created an empty temporary file: $TEMP_INIT_SQL_FILE. Check pg_dump output or DB connection."
    # Depending on desired behavior, you might want to exit 1 here too.
fi


# --- Copy the dump file directly (no PostGIS processing needed) ---
echo "   2. Copying $TEMP_INIT_SQL_FILE to $INIT_SQL_FILE"

cp "$TEMP_INIT_SQL_FILE" "$INIT_SQL_FILE"
echo "   Copy completed. Exit code: $?"


# Clean up the temporary file
if [ -f "$TEMP_INIT_SQL_FILE" ]; then
  rm "$TEMP_INIT_SQL_FILE"
  echo "   Cleaned up temporary file: $TEMP_INIT_SQL_FILE"
else
  echo "   Temporary file $TEMP_INIT_SQL_FILE was not found for cleanup (might indicate an earlier error)."
fi


if [ -f "$INIT_SQL_FILE" ] && [ -s "$INIT_SQL_FILE" ]; then
  echo "✅ Test database dump generated and processed successfully at $INIT_SQL_FILE"
else
  echo "🔴 ERROR: Final $INIT_SQL_FILE was not created or is empty."
  exit 1
fi