import prisma from "@singularity/db";
import { readFile } from "fs/promises";
import { join } from "path";

type KarunaStudent = {
  _id: { $oid: string };
  overall_s_no: number;
  s_no: number;
  course: string;
  branch: string;
  year: number;
  rollNo: string;
  enrollNo: string | null;
  name: string;
  SGPA: any;
  __v: number;
  CarryOvers: any[];
  Subjects: any[];
};

/**
 * Update student years in the database using karuna.students.json data
 * Matches students by roll number and updates their year field
 */
async function updateStudentYears() {
  console.log("📚 Starting year update process...\n");
  
  // Read the JSON file
  const karunaDataPath = join(process.cwd(), "..", "..", "karuna.students.json");
  console.log(`Reading data from: ${karunaDataPath}\n`);
  
  const fileContent = await readFile(karunaDataPath, "utf-8");
  const karunaData: KarunaStudent[] = JSON.parse(fileContent);
  
  console.log(`Found ${karunaData.length} students in JSON file\n`);
  
  let successful = 0;
  let failed = 0;
  let notFound = 0;
  
  const errors: Array<{ rollNo: string; error: string }> = [];

  for (const student of karunaData) {
    const rollNo = student.rollNo;
    const year = student.year;

    if (!rollNo || !year) {
      console.log(`⚠️  Skipping student - missing rollNo or year: ${JSON.stringify(student)}`);
      failed++;
      continue;
    }

    try {
      // Find the student in the database
      const existingStudent = await prisma.result.findFirst({
        where: { rollNo: rollNo },
      });

      if (!existingStudent) {
        console.log(`❌ Student not found in DB: ${rollNo}`);
        notFound++;
        continue;
      }

      // Update the year
      await prisma.result.update({
        where: { id: existingStudent.id },
        data: { year: year },
      });

      console.log(`✅ Updated year for ${student.name} (${rollNo}): Year ${year}`);
      successful++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Error updating ${rollNo}: ${errorMsg}`);
      errors.push({ rollNo, error: errorMsg });
      failed++;
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Year Update Summary:");
  console.log("=".repeat(50));
  console.log(`Total Students in JSON: ${karunaData.length}`);
  console.log(`Successfully Updated: ${successful} ✅`);
  console.log(`Not Found in DB: ${notFound} 🔍`);
  console.log(`Failed: ${failed} ❌`);
  console.log("=".repeat(50));

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach(({ rollNo, error }) => {
      console.log(`  - ${rollNo}: ${error}`);
    });
  }

  return {
    total: karunaData.length,
    successful,
    notFound,
    failed,
    errors,
  };
}

// Run the update
updateStudentYears()
  .then((result) => {
    console.log("\n✨ Year update process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
