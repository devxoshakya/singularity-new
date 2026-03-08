import { clearCheckpoint, getCheckpointStats, retryFailedUpdates } from "./updater";

/**
 * Checkpoint management utility
 * Usage: bun run checkpoint [command]
 */

const command = process.argv[2] || "status";

async function main() {
  try {
    switch (command) {
      case "status":
      case "stats":
        console.log("📊 Checkpoint Status:\n");
        const stats = await getCheckpointStats();
        console.log(`Total Processed: ${stats.totalProcessed} ✅`);
        console.log(`Total Failed: ${stats.totalFailed} ❌`);
        console.log(`Processed Count: ${stats.processedCount}`);
        console.log(`Failed Count: ${stats.failedCount}`);
        console.log(`Last Updated: ${stats.lastProcessedAt}`);
        break;

      case "clear":
      case "reset":
        console.log("🗑️  Clearing checkpoint...");
        await clearCheckpoint();
        break;

      case "retry":
      case "retry-failed":
        console.log("🔄 Retrying failed updates...\n");
        const result = await retryFailedUpdates();
        console.log("\nRetry completed:", result);
        break;

      case "help":
      default:
        console.log(`
📝 Checkpoint Management Commands:

  bun run checkpoint status      - Show checkpoint statistics
  bun run checkpoint clear       - Clear all checkpoint data
  bun run checkpoint retry       - Retry all failed updates
  bun run checkpoint help        - Show this help message

Examples:
  bun run checkpoint status
  bun run checkpoint clear
  bun run checkpoint retry
        `);
        break;
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
