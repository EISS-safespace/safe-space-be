#!/bin/bash

###############################################################################
# SafeSpace - Restore Script
# 
# This script restores backups created by backup.sh
#
# Usage: ./scripts/restore.sh [backup_date]
# Example: ./scripts/restore.sh 20240101_020000
###############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="/opt/safespace/backups"
COMPOSE_FILE="/opt/safespace/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if backup date provided
if [ -z "$1" ]; then
    error "Please provide backup date"
    echo "Usage: $0 [backup_date]"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR/database" | grep "db_" | sed 's/db_/  /' | sed 's/.sql.gz//'
    exit 1
fi

BACKUP_DATE=$1

# Check if backup exists
DB_BACKUP="$BACKUP_DIR/database/db_$BACKUP_DATE.sql.gz"
if [ ! -f "$DB_BACKUP" ]; then
    error "Backup not found: $DB_BACKUP"
    exit 1
fi

log "========================================="
log "SafeSpace Restore Process"
log "========================================="
log "Backup date: $BACKUP_DATE"
log "Database backup: $DB_BACKUP"
log "========================================="

# Confirmation
read -p "This will OVERWRITE current data. Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled"
    exit 0
fi

###############################################################################
# 1. Stop Services
###############################################################################

log "Stopping services..."
docker-compose -f "$COMPOSE_FILE" down

###############################################################################
# 2. Restore Database
###############################################################################

log "Starting PostgreSQL for restore..."
docker-compose -f "$COMPOSE_FILE" up -d postgres

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
sleep 10

log "Restoring database..."
gunzip -c "$DB_BACKUP" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d safespace_db

if [ $? -eq 0 ]; then
    log "Database restored successfully"
else
    error "Database restore failed"
    exit 1
fi

###############################################################################
# 3. Restore Volumes (Optional)
###############################################################################

read -p "Restore volumes? (yes/no): " RESTORE_VOLUMES
if [ "$RESTORE_VOLUMES" = "yes" ]; then
    log "Restoring volumes..."
    
    # Restore postgres data
    if [ -f "$BACKUP_DIR/volumes/postgres_data_$BACKUP_DATE.tar.gz" ]; then
        docker run --rm \
            -v safespace_postgres_data:/data \
            -v "$BACKUP_DIR/volumes":/backup \
            alpine sh -c "rm -rf /data/* && tar xzf /backup/postgres_data_$BACKUP_DATE.tar.gz -C /"
        log "PostgreSQL volume restored"
    fi
    
    # Restore redis data
    if [ -f "$BACKUP_DIR/volumes/redis_data_$BACKUP_DATE.tar.gz" ]; then
        docker run --rm \
            -v safespace_redis_data:/data \
            -v "$BACKUP_DIR/volumes":/backup \
            alpine sh -c "rm -rf /data/* && tar xzf /backup/redis_data_$BACKUP_DATE.tar.gz -C /"
        log "Redis volume restored"
    fi
    
    # Restore media uploads
    if [ -f "$BACKUP_DIR/volumes/media_uploads_$BACKUP_DATE.tar.gz" ]; then
        docker run --rm \
            -v safespace_media_uploads:/data \
            -v "$BACKUP_DIR/volumes":/backup \
            alpine sh -c "rm -rf /data/* && tar xzf /backup/media_uploads_$BACKUP_DATE.tar.gz -C /"
        log "Media uploads volume restored"
    fi
fi

###############################################################################
# 4. Restart All Services
###############################################################################

log "Starting all services..."
docker-compose -f "$COMPOSE_FILE" up -d

log "Waiting for services to be ready..."
sleep 30

###############################################################################
# 5. Verify Restore
###############################################################################

log "Verifying restore..."

# Check database connection
if docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d safespace_db -c "SELECT 1" > /dev/null 2>&1; then
    log "✅ Database connection verified"
else
    error "❌ Database connection failed"
fi

# Check services
docker-compose -f "$COMPOSE_FILE" ps

log "========================================="
log "Restore completed!"
log "========================================="
log "Please verify your application is working correctly"
log "========================================="

exit 0

