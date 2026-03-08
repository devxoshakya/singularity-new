import { existsSync } from "fs";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

interface Checkpoint {
  processedRollNumbers: string[];
  failedRollNumbers: string[];
  lastProcessedAt: string;
  totalProcessed: number;
  totalFailed: number;
}

const CHECKPOINT_DIR = join(process.cwd(), ".checkpoints");
const CHECKPOINT_FILE = join(CHECKPOINT_DIR, "update-progress.json");

export class CheckpointManager {
  private checkpoint: Checkpoint;

  constructor() {
    this.checkpoint = {
      processedRollNumbers: [],
      failedRollNumbers: [],
      lastProcessedAt: new Date().toISOString(),
      totalProcessed: 0,
      totalFailed: 0,
    };
  }

  /**
   * Load checkpoint from file if it exists
   */
  async load(): Promise<Checkpoint> {
    try {
      if (existsSync(CHECKPOINT_FILE)) {
        const data = await readFile(CHECKPOINT_FILE, "utf-8");
        this.checkpoint = JSON.parse(data);
        console.log(`📂 Checkpoint loaded: ${this.checkpoint.totalProcessed} already processed`);
        
        if (this.checkpoint.failedRollNumbers.length > 0) {
          console.log(`⚠️  ${this.checkpoint.failedRollNumbers.length} failed previously`);
        }
        
        return this.checkpoint;
      }
    } catch (error) {
      console.warn("Could not load checkpoint, starting fresh");
    }
    
    return this.checkpoint;
  }

  /**
   * Save checkpoint to file
   */
  async save(): Promise<void> {
    try {
      // Ensure checkpoint directory exists
      if (!existsSync(CHECKPOINT_DIR)) {
        await mkdir(CHECKPOINT_DIR, { recursive: true });
      }

      this.checkpoint.lastProcessedAt = new Date().toISOString();
      await writeFile(CHECKPOINT_FILE, JSON.stringify(this.checkpoint, null, 2));
    } catch (error) {
      console.error("Error saving checkpoint:", error);
    }
  }

  /**
   * Mark a roll number as processed
   */
  async markProcessed(rollNo: string, success: boolean): Promise<void> {
    if (success) {
      this.checkpoint.processedRollNumbers.push(rollNo);
      this.checkpoint.totalProcessed++;
    } else {
      this.checkpoint.failedRollNumbers.push(rollNo);
      this.checkpoint.totalFailed++;
    }
    
    // Save checkpoint every successful update
    if (success) {
      await this.save();
    }
  }

  /**
   * Check if a roll number has been processed
   */
  isProcessed(rollNo: string): boolean {
    return this.checkpoint.processedRollNumbers.includes(rollNo);
  }

  /**
   * Check if a roll number failed previously
   */
  hasFailed(rollNo: string): boolean {
    return this.checkpoint.failedRollNumbers.includes(rollNo);
  }

  /**
   * Get all failed roll numbers
   */
  getFailedRollNumbers(): string[] {
    return [...this.checkpoint.failedRollNumbers];
  }

  /**
   * Get checkpoint stats
   */
  getStats() {
    return {
      totalProcessed: this.checkpoint.totalProcessed,
      totalFailed: this.checkpoint.totalFailed,
      lastProcessedAt: this.checkpoint.lastProcessedAt,
      processedCount: this.checkpoint.processedRollNumbers.length,
      failedCount: this.checkpoint.failedRollNumbers.length,
    };
  }

  /**
   * Clear checkpoint file
   */
  async clear(): Promise<void> {
    try {
      if (existsSync(CHECKPOINT_FILE)) {
        await unlink(CHECKPOINT_FILE);
        console.log("✅ Checkpoint cleared");
      }
      
      this.checkpoint = {
        processedRollNumbers: [],
        failedRollNumbers: [],
        lastProcessedAt: new Date().toISOString(),
        totalProcessed: 0,
        totalFailed: 0,
      };
    } catch (error) {
      console.error("Error clearing checkpoint:", error);
    }
  }

  /**
   * Reset only failed roll numbers (for retry)
   */
  async resetFailed(): Promise<void> {
    const failedCount = this.checkpoint.failedRollNumbers.length;
    this.checkpoint.failedRollNumbers = [];
    this.checkpoint.totalFailed = 0;
    await this.save();
    console.log(`✅ Reset ${failedCount} failed roll numbers`);
  }
}
