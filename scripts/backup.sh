#!/bin/bash

###############################################################################
# SafeSpace - Automated Backup Script
# 
# This script performs automated backups of:
# - PostgreSQL database
# - Docker volumes
# - Application configuration
#
# Usage: ./scripts/backup.sh
# Cron: 0 2 * * * /opt/safespace/scripts/backup.sh >> /var/log/safespace-backup.log 2>&1
###############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="/opt/safespace/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
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

# Create backup directory
log "Creating backup directory..."
mkdir -p "$BACKUP_DIR"/{database,volumes,config}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Exiting."
    exit 1
fi

# Check if services are running
if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    warning "Some services may not be running"
fi

###############################################################################
# 1. Backup PostgreSQL Database
###############################################################################

log "Starting database backup..."

DB_BACKUP_FILE="$BACKUP_DIR/database/db_$DATE.sql"
DB_BACKUP_COMPRESSED="$BACKUP_DIR/database/db_$DATE.sql.gz"

# Dump database
if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres safespace_db > "$DB_BACKUP_FILE"; then
    log "Database dumped successfully"
    
    # Compress backup
    gzip "$DB_BACKUP_FILE"
    log "Database backup compressed: $DB_BACKUP_COMPRESSED"
    
    # Calculate size
    SIZE=$(du -h "$DB_BACKUP_COMPRESSED" | cut -f1)
    log "Backup size: $SIZE"
else
    error "Database backup failed"
    exit 1
fi

###############################################################################
# 2. Backup Docker Volumes
###############################################################################

log "Starting volume backup..."

VOLUME_BACKUP_FILE="$BACKUP_DIR/volumes/volumes_$DATE.tar.gz"

# Backup postgres data volume
if docker run --rm \
    -v safespace_postgres_data:/data \
    -v "$BACKUP_DIR/volumes":/backup \
    alpine tar czf /backup/postgres_data_$DATE.tar.gz /data; then
    log "PostgreSQL volume backed up successfully"
else
    error "PostgreSQL volume backup failed"
fi

# Backup redis data volume
if docker run --rm \
    -v safespace_redis_data:/data \
    -v "$BACKUP_DIR/volumes":/backup \
    alpine tar czf /backup/redis_data_$DATE.tar.gz /data; then
    log "Redis volume backed up successfully"
else
    error "Redis volume backup failed"
fi

# Backup media uploads volume
if docker run --rm \
    -v safespace_media_uploads:/data \
    -v "$BACKUP_DIR/volumes":/backup \
    alpine tar czf /backup/media_uploads_$DATE.tar.gz /data; then
    log "Media uploads volume backed up successfully"
else
    error "Media uploads volume backup failed"
fi

###############################################################################
# 3. Backup Configuration Files
###############################################################################

log "Starting configuration backup..."

CONFIG_BACKUP_FILE="$BACKUP_DIR/config/config_$DATE.tar.gz"

# Backup important config files
tar czf "$CONFIG_BACKUP_FILE" \
    -C /opt/safespace \
    docker-compose.yml \
    .env \
    nginx/nginx.conf \
    2>/dev/null || warning "Some config files may be missing"

log "Configuration backed up successfully"

###############################################################################
# 4. Cleanup Old Backups
###############################################################################

log "Cleaning up old backups (older than $RETENTION_DAYS days)..."

# Delete old database backups
find "$BACKUP_DIR/database" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
DELETED_DB=$(find "$BACKUP_DIR/database" -name "db_*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log "Deleted $DELETED_DB old database backups"

# Delete old volume backups
find "$BACKUP_DIR/volumes" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
DELETED_VOL=$(find "$BACKUP_DIR/volumes" -name "*.tar.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log "Deleted $DELETED_VOL old volume backups"

# Delete old config backups
find "$BACKUP_DIR/config" -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -delete
DELETED_CFG=$(find "$BACKUP_DIR/config" -name "config_*.tar.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log "Deleted $DELETED_CFG old config backups"

###############################################################################
# 5. Backup Summary
###############################################################################

log "========================================="
log "Backup completed successfully!"
log "========================================="
log "Date: $DATE"
log "Database backup: $DB_BACKUP_COMPRESSED"
log "Volume backups: $BACKUP_DIR/volumes/*_$DATE.tar.gz"
log "Config backup: $CONFIG_BACKUP_FILE"
log "========================================="

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Total backup directory size: $TOTAL_SIZE"

# Count total backups
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -type f | wc -l)
log "Total backup files: $TOTAL_BACKUPS"

log "========================================="

exit 0

