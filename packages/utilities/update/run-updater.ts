import {
  updateStudentResult,
  updateAllUsersResults,
  updateBatchResults,
  updateRangeResults,
  clearCheckpoint,
  getCheckpointStats,
  retryFailedUpdates,
} from "./updater";

/**
 * Example usage of the updater functions with checkpoint support
 * 
 * The checkpoint system automatically saves progress after each update.
 * If the process is interrupted, simply run it again to resume.
 */

async function main() {
  try {
    // View checkpoint stats before starting
    console.log("📊 Current checkpoint status:");
    const stats = await getCheckpointStats();
    console.log(stats);
    console.log("\n");

    // Option 1: Update a single student by roll number
    // const result = await updateStudentResult(2300680100119);
    // console.log(result);

    // Option 2: Update all results from the Result table (with auto-resume)
    // If interrupted, this will automatically skip already processed roll numbers
    const summary = await updateAllUsersResults();
    console.log(summary);

    // Option 3: Start fresh (clear checkpoint and process all)
    // await clearCheckpoint();
    // const summary = await updateAllUsersResults({ skipCheckpoint: true });
    // console.log(summary);

    // Option 4: Retry only failed roll numbers
    // const retryResult = await retryFailedUpdates();
    // console.log(retryResult);

    // Option 5: Update a batch of specific roll numbers (with checkpoint)
    // const batchSummary = await updateBatchResults([
    //   2300680100119,
    //   2300680100120,
    //   2300680100121,
    // ]);
    // console.log(batchSummary);

    // Option 6: Update a range of roll numbers (with checkpoint)
    // const rangeSummary = await updateRangeResults(2300680100001, 2300680100050);
    // console.log(rangeSummary);

    // Option 7: Clear checkpoint data (reset progress)
    // await clearCheckpoint();

  } catch (error) {
    console.error("\n❌ Error in main:", error);
    console.log("\n💡 Your progress has been saved. Run this script again to resume.");
    process.exit(1);
  }
}

main();
