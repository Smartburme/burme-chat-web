# server/scripts/backup.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# MongoDB Backup
mongodump --uri=$MONGODB_URI --out=$BACKUP_DIR/$DATE

# Upload to S3
aws s3 cp $BACKUP_DIR/$DATE s3://your-bucket/backups/$DATE --recursive

# Cleanup old backups
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
