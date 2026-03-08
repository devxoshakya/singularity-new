// Core solver function
export { solver } from "./core/solver";

// Updater functions
export {
  updateStudentResult,
  updateAllUsersResults,
  updateBatchResults,
  updateRangeResults,
  clearCheckpoint,
  getCheckpointStats,
  retryFailedUpdates,
} from "./update/updater";

// Checkpoint manager for advanced use cases
export { CheckpointManager } from "./update/checkpoint";