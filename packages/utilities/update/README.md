# Student Results Updater

A robust system for updating student results with automatic checkpoint/resume functionality.

## Features

✅ **Automatic Checkpointing** - Progress is saved after each successful update  
✅ **Auto-Resume** - If interrupted, automatically resumes from where it left off  
✅ **Error Handling** - Tracks failed updates separately for retry  
✅ **Flexible Options** - Multiple update modes (single, batch, range, all users)  
✅ **Rate Limiting** - 1-second delay between requests to avoid overwhelming servers  
✅ **Progress Tracking** - Detailed statistics and logging  
✅ **Year Updates** - Update student years from JSON data

## Quick Start

```bash
# Update all results from the database
bun run update

# Update student years from karuna.students.json
bun run update-years

# Check checkpoint status
bun run checkpoint status

# Clear checkpoint and start fresh
bun run checkpoint clear

# Retry failed updates
bun run checkpoint retry
```

## Usage

### 1. Update Student Years

Update the year field for all students using data from `karuna.students.json`:

```bash
bun run update-years
```

This script:
- Reads student data from `karuna.students.json` in the project root
- Matches students by roll number
- Updates the year field in the database
- Provides detailed progress reporting

**Important**: Run this after importing new student data to ensure year values are correct.

### 2. Update All Results (Recommended)

This will fetch all roll numbers from the Result table and update them with the latest data. If interrupted, run again to resume.

**Note**: The updater now preserves existing year values. It only uses roll number-based year extraction as a fallback for new records.

```bash
bun run update
```

### 3. Check Checkpoint Status

View current progress and statistics:

```bash
bun run checkpoint status
```

Output:
```
📊 Checkpoint Status:

Total Processed: 245 ✅
Total Failed: 12 ❌
Processed Count: 245
Failed Count: 12
Last Updated: 2026-03-08T17:30:45.123Z
```

### 3. Retry Failed Updates

Retry only the roll numbers that failed previously:

```bash
bun run checkpoint retry
```

### 4. Clear Checkpoint

Reset all progress and start fresh:

```bash
bun run checkpoint clear
```

## Programmatic Usage

You can also use the updater functions directly in your code:

### Update Single Student

```typescript
import { updateStudentResult } from "@singularity/utilities";

const result = await updateStudentResult(2300680100119);
console.log(result);
```

### Update All Results (with auto-resume)

```typescript
import { updateAllUsersResults } from "@singularity/utilities";

// Automatically resumes from checkpoint
const summary = await updateAllUsersResults();
console.log(summary);

// Start fresh (ignore checkpoint)
const freshSummary = await updateAllUsersResults({ skipCheckpoint: true });
```

### Update Batch of Roll Numbers

```typescript
import { updateBatchResults } from "@singularity/utilities";

const rollNumbers = [2300680100119, 2300680100120, 2300680100121];
const result = await updateBatchResults(rollNumbers);
```

### Update Range of Roll Numbers

```typescript
import { updateRangeResults } from "@singularity/utilities";

const result = await updateRangeResults(2300680100001, 2300680100100);
```

### Checkpoint Management

```typescript
import { 
  getCheckpointStats, 
  clearCheckpoint, 
  retryFailedUpdates 
} from "@singularity/utilities";

// Get stats
const stats = await getCheckpointStats();

// Clear checkpoint
await clearCheckpoint();

// Retry failed
const result = await retryFailedUpdates();
```

### Advanced: Custom Checkpoint Logic

```typescript
import { CheckpointManager } from "@singularity/utilities";

const checkpoint = new CheckpointManager();
await checkpoint.load();

// Check if processed
if (checkpoint.isProcessed("2300680100119")) {
  console.log("Already processed");
}

// Mark as processed
await checkpoint.markProcessed("2300680100119", true);

// Get failed roll numbers
const failed = checkpoint.getFailedRollNumbers();
```

## How It Works

### Checkpoint System

The checkpoint system automatically saves progress to `.checkpoints/update-progress.json`:

```json
{
  "processedRollNumbers": ["2300680100119", "2300680100120"],
  "failedRollNumbers": ["2300680100150"],
  "lastProcessedAt": "2026-03-08T17:30:45.123Z",
  "totalProcessed": 2,
  "totalFailed": 1
}
```

### Resume Behavior

When you run an update:

1. **Loads checkpoint** - Checks for existing progress
2. **Skips processed** - Automatically skips already updated roll numbers
3. **Saves after each** - Checkpoint saved after each successful update
4. **Tracks failures** - Failed updates tracked separately for retry

### Error Handling

If the process crashes or is interrupted:

- ✅ All successful updates are saved in the checkpoint
- ✅ Failed updates are tracked separately
- ✅ Simply run the command again to resume
- ✅ Use `bun run checkpoint retry` to retry only failed ones

## Commands Reference

| Command | Description |
|---------|-------------|
| `bun run update` | Run the main updater (resumes automatically) |
| `bun run checkpoint status` | Show checkpoint statistics |
| `bun run checkpoint clear` | Clear all checkpoint data |
| `bun run checkpoint retry` | Retry only failed updates |
| `bun run checkpoint help` | Show checkpoint help |

## Examples

### Resume Interrupted Update

```bash
# Start update
bun run update
# ... process interrupted ...

# Resume from where it left off (same command)
bun run update
```

### Clear and Start Fresh

```bash
# Clear checkpoint
bun run checkpoint clear

# Run update
bun run update
```

### Check Progress

```bash
# While running or after completion
bun run checkpoint status
```

### Handle Failures

```bash
# After update completes with failures
bun run checkpoint status  # Check how many failed

# Retry only failed ones
bun run checkpoint retry
```

## Configuration

### Rate Limiting

Default: 1 second delay between requests. To modify, edit `updater.ts`:

```typescript
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second
```

### Checkpoint Location

Default: `.checkpoints/update-progress.json`

To change location, modify `checkpoint.ts`:

```typescript
const CHECKPOINT_DIR = join(process.cwd(), ".checkpoints");
```

## Troubleshooting

### Checkpoint not saving

- Check write permissions for `.checkpoints/` directory
- Ensure sufficient disk space
- Check console for error messages

### Updates not resuming

- Verify checkpoint file exists: `.checkpoints/update-progress.json`
- Try `bun run checkpoint status` to verify checkpoint is loaded
- If corrupted, use `bun run checkpoint clear` and start fresh

### High failure rate

- Check network connectivity
- Verify database connection
- Check if roll numbers are valid
- Review error messages in console

## Best Practices

1. **Monitor Progress** - Regularly check `bun run checkpoint status`
2. **Handle Failures** - Use `bun run checkpoint retry` after initial run
3. **Clear When Done** - Use `bun run checkpoint clear` after successful completion
4. **Backup Data** - Keep database backups before large updates
5. **Test First** - Run on small batch before processing all users

## API Reference

See inline documentation in:
- [updater.ts](./updater.ts) - Update functions
- [checkpoint.ts](./checkpoint.ts) - Checkpoint manager
- [checkpoint-cli.ts](./checkpoint-cli.ts) - CLI utility
