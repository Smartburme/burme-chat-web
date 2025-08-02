const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const { exec } = require('child_process');
const { DB_NAME } = require('../../config');

const backupDir = path.join(__dirname, '../../backups');

const backupDatabase = async () => {
  try {
    // Create backup directory if not exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Clean up old backups (keep last 7)
    const files = await readdir(backupDir);
    if (files.length >= 7) {
      const oldestFile = files.sort()[0];
      await unlink(path.join(backupDir, oldestFile));
    }

    // Create new backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.gz`);

    await new Promise((resolve, reject) => {
      exec(`mongodump --db=${DB_NAME} --archive=${backupFile} --gzip`, 
        (error, stdout, stderr) => {
          if (error) {
            console.error('Backup failed:', stderr);
            return reject(error);
          }
          console.log('Backup successful:', stdout);
          resolve();
        }
      );
    });

    return backupFile;
  } catch (err) {
    console.error('Backup process failed:', err);
    throw err;
  }
};

module.exports = backupDatabase;
