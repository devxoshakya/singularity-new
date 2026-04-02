import prisma from "@singularity/db";
import { solver } from "../core/solver";
import { CheckpointManager } from "./checkpoint";

/**
 * Extract year from roll number
 * Roll number format: YYYYXXXXXXXX (first 2 digits represent year)
 */
function extractYearFromRollNo(rollNo: string): number {
  const yearPrefix = rollNo.substring(0, 2);
  return 2000 + parseInt(yearPrefix);
}

/**
 * Update a single student's result by roll number
 */
 /**
  * Update a single student's result by roll number
  */
 export async function updateStudentResult(rollNo: number) {
   try {
     console.log(`Fetching result for roll number: ${rollNo}`);
     
     const resultData = await solver(rollNo);
     
     if (!resultData) {
       console.log(`No result found for roll number: ${rollNo}`);
       return { success: false, rollNo, error: "No data returned from solver" };
     }
 
     // Check if student already exists to preserve their year
     const existingStudent = await prisma.result.findFirst({
       where: { rollNo: resultData.rollNo },
       select: { year: true },
     });
 
     const year = existingStudent?.year ?? extractYearFromRollNo(resultData.rollNo);
 
     // 1. Transform the dynamic 'semesters' dictionary into the Prisma-compliant array
     const semestersArray = Object.values(resultData.semesters);
 
     // 2. Strict Type Check for CarryOvers
     // If the scraper returned ["No Backlogs"], we save an empty array [] to satisfy Prisma's strict types
     const formattedCarryOvers = (resultData.CarryOvers.length > 0 && typeof resultData.CarryOvers[0] !== 'string') 
       ? resultData.CarryOvers 
       : [];
 
     // 3. Upsert the result (All nested subjects go directly into the document!)
     const result = await prisma.result.upsert({
       where: {
         rollNo: resultData.rollNo,
       },
       update: {
         enrollmentNo: resultData.enrollmentNo,
         fullName: resultData.fullName,
         fatherName: resultData.fatherName,
         course: resultData.course,
         branch: resultData.branch,
         year: year,
         CarryOvers: formattedCarryOvers,
         divison: resultData.division || resultData.divison, // fallback matching your scraper output
         cgpa: resultData.cgpa,
         instituteName: resultData.instituteName,
         latestResultStatus: resultData.latestResultStatus,
         totalMarksObtained: resultData.totalMarksObtained,
         latestCOP: resultData.latestCOP,
         semesters: semestersArray, // Sub-documents natively embedded!
       },
       create: {
         rollNo: resultData.rollNo,
         enrollmentNo: resultData.enrollmentNo,
         fullName: resultData.fullName,
         fatherName: resultData.fatherName,
         course: resultData.course,
         branch: resultData.branch,
         year: year,
         CarryOvers: formattedCarryOvers,
         divison: resultData.division || resultData.divison,
         cgpa: resultData.cgpa,
         instituteName: resultData.instituteName,
         latestResultStatus: resultData.latestResultStatus,
         totalMarksObtained: resultData.totalMarksObtained,
         latestCOP: resultData.latestCOP,
         semesters: semestersArray, // Sub-documents natively embedded!
       },
     });
 
     // NOTE: We completely deleted the `prisma.subject.deleteMany` and `prisma.subject.createMany` 
     // lines here because MongoDB handles the replacement of the entire `semesters` array automatically!
 
     console.log(`✅ Successfully updated result for: ${resultData.fullName} (${resultData.rollNo})`);
     return { success: true, rollNo: resultData.rollNo, name: resultData.fullName };
     
   } catch (error) {
     console.error(`❌ Error updating result for roll number ${rollNo}:`, error);
     return { success: false, rollNo, error: error instanceof Error ? error.message : "Unknown error" };
   }
 }

/**
 * Update all student results from the Result table
 * Supports checkpoint/resume functionality
 */
export async function updateAllUsersResults(options: { skipCheckpoint?: boolean; retryFailed?: boolean } = {}) {
  const checkpointManager = new CheckpointManager();
  
  try {
    // Load checkpoint unless explicitly skipped
    if (!options.skipCheckpoint) {
      await checkpointManager.load();
    }
    
    console.log("📚 Fetching all results from database...");
    
    // Fetch all results that need to be updated
    const results = await prisma.result.findMany({
      select: {
        rollNo: true,
        fullName: true,
      },
    });

    console.log(`Found ${results.length} results in database`);

    if (results.length === 0) {
      console.log("No results found in database");
      return { total: 0, successful: 0, failed: 0, skipped: 0, results: [] };
    }

    const updateResults = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    // If retryFailed is true, only process previously failed roll numbers
    const rollNumbersToProcess = options.retryFailed
      ? checkpointManager.getFailedRollNumbers()
      : results.map(r => r.rollNo).filter(Boolean) as string[];

    console.log(`Processing ${rollNumbersToProcess.length} roll numbers...`);

    // Process each result
    for (const rollNoString of rollNumbersToProcess) {
      if (!rollNoString) continue;

      // Skip if already processed (unless retrying failed)
      if (!options.retryFailed && checkpointManager.isProcessed(rollNoString)) {
        skipped++;
        console.log(`⏭️  Skipping ${rollNoString} (already processed)`);
        continue;
      }

      const rollNoNumber = parseInt(rollNoString);
      const result = await updateStudentResult(rollNoNumber);
      updateResults.push(result);

      if (result.success) {
        successful++;
        await checkpointManager.markProcessed(rollNoString, true);
      } else {
        failed++;
        await checkpointManager.markProcessed(rollNoString, false);
      }

      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final save
    await checkpointManager.save();

    console.log("\n📊 Update Summary:");
    console.log(`Total: ${rollNumbersToProcess.length}`);
    console.log(`Successful: ${successful} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Skipped: ${skipped} ⏭️`);

    const stats = checkpointManager.getStats();
    console.log(`\n📈 Overall Progress:`);
    console.log(`Total Processed: ${stats.totalProcessed}`);
    console.log(`Total Failed: ${stats.totalFailed}`);
    console.log(`Last Updated: ${stats.lastProcessedAt}`);

    return {
      total: rollNumbersToProcess.length,
      successful,
      failed,
      skipped,
      results: updateResults,
      stats,
    };
    
  } catch (error) {
    // Save checkpoint on error
    await checkpointManager.save();
    console.error("\n❌ Error updating results. Progress saved to checkpoint.");
    console.error("Run again to resume from where you left off.");
    throw error;
  }
}

/**
 * Update results for a batch of roll numbers
 * Supports checkpoint/resume functionality
 */
export async function updateBatchResults(rollNumbers: number[], options: { skipCheckpoint?: boolean } = {}) {
  const checkpointManager = new CheckpointManager();
  
  try {
    // Load checkpoint unless explicitly skipped
    if (!options.skipCheckpoint) {
      await checkpointManager.load();
    }
    
    console.log(`📚 Updating batch of ${rollNumbers.length} roll numbers...`);

    const results = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const rollNo of rollNumbers) {
      const rollNoString = rollNo.toString();
      
      // Skip if already processed
      if (checkpointManager.isProcessed(rollNoString)) {
        skipped++;
        console.log(`⏭️  Skipping ${rollNo} (already processed)`);
        continue;
      }
      
      const result = await updateStudentResult(rollNo);
      results.push(result);

      if (result.success) {
        successful++;
        await checkpointManager.markProcessed(rollNoString, true);
      } else {
        failed++;
        await checkpointManager.markProcessed(rollNoString, false);
      }

      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final save
    await checkpointManager.save();

    console.log("\n📊 Batch Update Summary:");
    console.log(`Total: ${rollNumbers.length}`);
    console.log(`Successful: ${successful} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Skipped: ${skipped} ⏭️`);

    const stats = checkpointManager.getStats();
    console.log(`\n📈 Overall Progress:`);
    console.log(`Total Processed: ${stats.totalProcessed}`);
    console.log(`Total Failed: ${stats.totalFailed}`);

    return {
      total: rollNumbers.length,
      successful,
      failed,
      skipped,
      results,
      stats,
    };
  } catch (error) {
    // Save checkpoint on error
    await checkpointManager.save();
    console.error("\n❌ Error in batch update. Progress saved to checkpoint.");
    console.error("Run again to resume from where you left off.");
    throw error;
  }
}

/**
 * Update results for a range of roll numbers
 * Supports checkpoint/resume functionality
 * Example: updateRangeResults(2300680100001, 2300680100100)
 */
export async function updateRangeResults(startRollNo: number, endRollNo: number, options: { skipCheckpoint?: boolean } = {}) {
  console.log(`📚 Updating roll numbers from ${startRollNo} to ${endRollNo}...`);

  const rollNumbers = [];
  for (let i = startRollNo; i <= endRollNo; i++) {
    rollNumbers.push(i);
  }

  return updateBatchResults(rollNumbers, options);
}

/**
 * Clear all checkpoint data
 */
export async function clearCheckpoint() {
  const checkpointManager = new CheckpointManager();
  await checkpointManager.clear();
}

/**
 * Get checkpoint statistics
 */
export async function getCheckpointStats() {
  const checkpointManager = new CheckpointManager();
  await checkpointManager.load();
  return checkpointManager.getStats();
}

/**
 * Retry only the failed roll numbers from the checkpoint
 */
export async function retryFailedUpdates() {
  const checkpointManager = new CheckpointManager();
  await checkpointManager.load();
  
  const failedRollNumbers = checkpointManager.getFailedRollNumbers();
  
  if (failedRollNumbers.length === 0) {
    console.log("No failed roll numbers to retry");
    return { total: 0, successful: 0, failed: 0, skipped: 0, results: [] };
  }
  
  console.log(`🔄 Retrying ${failedRollNumbers.length} failed roll numbers...`);
  
  // Reset failed status before retrying
  await checkpointManager.resetFailed();
  
  return updateAllUsersResults({ retryFailed: true });
}

// Example usage:
// For testing, you can run:
// const result = await updateStudentResult(2300680100119);
// console.log(result);
//
// Or update all results from the Result table:
// const summary = await updateAllUsersResults();
// console.log(summary);
