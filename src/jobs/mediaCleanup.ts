import { Op } from 'sequelize';
import { PostMedia } from '../models/index.js';
import { deleteFile } from '../services/mediaStorage.js';

/**
 * Clean up orphaned media files
 * - Delete media marked as deleted more than 30 days ago
 * - Delete media from posts that have been deleted
 */
export const cleanupOrphanedMedia = async (): Promise<void> => {
  try {
    console.log('🧹 Starting media cleanup job...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find media marked as deleted more than 30 days ago
    const orphanedMedia = await PostMedia.findAll({
      where: {
        deletedAt: {
          [Op.lte]: thirtyDaysAgo,
        },
      },
    });

    console.log(`Found ${orphanedMedia.length} orphaned media files to delete`);

    let deletedCount = 0;
    let errorCount = 0;

    for (const media of orphanedMedia) {
      try {
        // Delete from storage
        await deleteFile(media.originalUrl);
        if (media.thumbnailUrl) {
          await deleteFile(media.thumbnailUrl);
        }

        // Permanently delete from database
        await media.destroy();
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting media ${media.id}:`, error);
        errorCount++;
      }
    }

    console.log(
      `✅ Media cleanup completed: ${deletedCount} deleted, ${errorCount} errors`,
    );
  } catch (error) {
    console.error('❌ Media cleanup job failed:', error);
  }
};

/**
 * Schedule media cleanup job
 * Run daily at 2 AM
 */
export const scheduleMediaCleanup = (): void => {
  // Run immediately on startup
  cleanupOrphanedMedia();

  // Schedule to run daily at 2 AM
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(2, 0, 0, 0);

  // If 2 AM has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilFirstRun = scheduledTime.getTime() - now.getTime();

  setTimeout(() => {
    cleanupOrphanedMedia();
    // Then run every 24 hours
    setInterval(cleanupOrphanedMedia, 24 * 60 * 60 * 1000);
  }, timeUntilFirstRun);

  console.log(
    `📅 Media cleanup job scheduled to run daily at 2 AM (next run: ${scheduledTime.toLocaleString()})`,
  );
};
