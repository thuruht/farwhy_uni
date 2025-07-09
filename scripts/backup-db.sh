#!/bin/bash
# scripts/backup-db.sh
# ----------------------------------------------------------------------
# Database backup script for Farewell/Howdy Unified Project
# Usage: ./scripts/backup-db.sh
#
# Creates a backup of the D1 database and stores it in backups/
# ----------------------------------------------------------------------

# Set the directory to the project root
cd "$(dirname "$0")/.." || exit 1

# Create backup directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Create a timestamp for the backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "Creating database backup..."

# Export the D1 database using wrangler
npx wrangler d1 export FWHY_D1 --output="$BACKUP_FILE"

# Check if the backup was successful
if [ -f "$BACKUP_FILE" ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
  echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "Error: Backup failed"
  exit 1
fi
