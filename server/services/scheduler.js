const cron = require('node-cron');
const User = require('../models/User');
const backupDatabase = require('./backup');
const analyticsService = require('./analyticsService');

// Daily backup at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running daily database backup...');
  backupDatabase().catch(console.error);
});

// Weekly analytics report every Monday at 3 AM
cron.schedule('0 3 * * 1', () => {
  console.log('Generating weekly analytics report...');
  analyticsService.generateWeeklyReport().catch(console.error);
});

// Monthly inactive user cleanup on the 1st at 4 AM
cron.schedule('0 4 1 * *', async () => {
  console.log('Cleaning up inactive users...');
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months inactive
    
    const result = await User.deleteMany({
      lastActive: { $lt: cutoffDate },
      isAdmin: { $ne: true }
    });
    
    console.log(`Removed ${result.deletedCount} inactive users`);
  } catch (err) {
    console.error('Inactive user cleanup failed:', err);
  }
});
