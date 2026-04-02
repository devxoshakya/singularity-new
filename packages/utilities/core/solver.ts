import { stringify } from "qs"; 
import * as cheerio from "cheerio";

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
];

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)]!;
}

export async function solver(rollNo: number) {
  const data = stringify({
    __EVENTTARGET: "",
    __EVENTARGUMENT: "",
    __VIEWSTATE:
      "/wEPDwULLTExMDg0MzM4NTIPZBYCAgMPZBYEAgMPZBYEAgkPDxYCHgdWaXNpYmxlaGRkAgsPDxYCHwBnZBYCAgEPZBYEAgMPDxYCHgdFbmFibGVkaGRkAgUPFgIfAWhkAgkPZBYCAgEPZBYCZg9kFgICAQ88KwARAgEQFgAWABYADBQrAABkGAEFEmdyZFZpZXdDb25mbGljdGlvbg9nZEj7pHjMdpqzXPMViMldFkeGjx3IpdUVid7sjedCGPPI",
    __VIEWSTATEGENERATOR: "FF2D60E4",
    __EVENTVALIDATION:
      "/wEdAAWjieCZ6D3jJPRsYhIb4WL1WB/t8XsfPbhKtaDxBSD9L47U3Vc0WZ+wxclqyPFfzmNKpf/A83qpx8oXSYxifk/OuqJzdLRkOMLOoT0zZmF15DWzOb+YJ8ghyo6LVCa9G/Z8aT4v6Aejt4yzYIiEWTI1",
    txtRollNo: rollNo,
    "g-recaptcha-response": "YOUR_CAPTCHA_RESPONSE",
    btnSearch: "खोजें",
    hidForModel: "",
  });

  const config = {
    method: "POST",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "max-age=0",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie:
        "_ga=GA1.3.1697488153.1727509287; _gid=GA1.3.1575576470.1730317667; ASP.NET_SessionId=bbrjqaqsolzdcpiezpaszopf; _gat=1; _ga_P8H34B230T=GS1.3.1730465975.7.1.1730466806.0.0.0",
      Origin: "https://oneview.aktu.ac.in",
      Referer: "https://oneview.aktu.ac.in/WebPages/AKTU/OneView.aspx",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": getRandomUserAgent(),
      "sec-ch-ua":
        '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    },
    body: data,
  };

  try {
    const response = await fetch(
      "https://oneview.aktu.ac.in/WebPages/AKTU/OneView.aspx",
      config
    );
    
    // FIX: Extract raw HTML without JSON.stringify
    const htmlText = await response.text();
    
    // LOG: Check if we actually got the expected HTML or a CAPTCHA/Error page
    console.log("--- HTML FETCH SUCCESS ---");
    console.log(`Response length: ${htmlText.length} characters`);
    
    if (htmlText.includes("YOUR_CAPTCHA_RESPONSE") || htmlText.includes("Captcha")) {
        console.warn("WARNING: Captcha string detected in response. You might be blocked.");
    }

    const parseData = parseHTML(htmlText);
    return parseData;
  } catch (error) {
    console.error("Error during fetch:", error);
  }
}

function cleanString(str: string | undefined | null): string {
  return str ? str.replace(/\\r|\\n|\n|\r/g, "").trim() : "N/A";
}

export function parseHTML(htmlContent: string) {
  const $ = cheerio.load(htmlContent);

  // 1. Extract Primary Student Details
  const rollNo = cleanString($('#lblRollNo').text());
  const enrollmentNo = cleanString($('#lblEnrollmentNo').text());
  const fullName = cleanString($('#lblFullName').text());
  const fatherName = cleanString($('#lblFatherName').text());
  const course = cleanString($('#lblCourse').text());
  const branch = cleanString($('#lblBranch').text());
  const institute = cleanString($('#lblInstitute').text());

  // Validate if page loaded correctly
  if (rollNo === "N/A" || !rollNo) {
    return null;
  }

  const cgpa = cleanString($('#lblFinalMO').text());
  const division = cleanString($('#lblDivisionAwarded').text());

  // 2. Parse Semesters Data
  // By mapping to an object keyed by Semester ID, older data is safely
  // overwritten by newer "BACK" sessions that appear later in the DOM.
  const semestersData: Record<string, any> = {};

  $('table[id$="_grdViewSubjectMarksheet"]').each((_, tableEl) => {
    const container = $(tableEl).closest('.col-md-6');

    const semId = container.find('span[id$="_lblSemesterId"]').text().trim();
    if (!semId) return;

    const evenOdd = container.find('span[id$="_lblEvenOdd"]').text().trim();
    const totalMarksObtained = container.find('span[id$="_lblSemesterTotalMarksObtained"]').text().trim();
    const resultStatus = container.find('span[id$="_lblResultStatus"]').text().trim();
    const sgpaValue = parseFloat(container.find('span[id$="_lblSGPA"]').text().trim()) || 0;
    const dateOfDeclaration = container.find('span[id$="_lblDateOfDeclaration"]').text().trim();

    // Extract all subjects within this semester
    const subjects: any[] = [];
    $(tableEl).find('tr').each((i, tr) => {
      if (i === 0) return; // Skip the table header row

      const tds = $(tr).find('td');
      if (tds.length >= 7) {
        subjects.push({
          code: cleanString($(tds[0]).text()),
          name: cleanString($(tds[1]).text()),
          type: cleanString($(tds[2]).text()),
          internal: cleanString($(tds[3]).text()),
          external: cleanString($(tds[4]).text()),
          backPaper: cleanString($(tds[5]).text()),
          grade: cleanString($(tds[6]).text()),
        });
      }
    });

    // Overwrite the semester payload. This naturally isolates the latest 
    // performance stats (Regular vs Back) per semester, wiping out cleared COPs.
    semestersData[`sem${semId}`] = {
      semester: semId,
      evenOdd,
      totalMarksObtained: parseInt(totalMarksObtained) || 0,
      resultStatus,
      SGPA: sgpaValue,
      dateOfDeclaration,
      subjects
    };
  });

  // 3. Determine Active Carry Overs (COPs) from the finalized, latest data
  const activeCarryOvers: any[] = [];
  let totalMarksAllSemesters = 0;

  Object.values(semestersData).forEach((semData: any) => {
    totalMarksAllSemesters += semData.totalMarksObtained;

    semData.subjects.forEach((subject: any) => {
      // F or ABS indicates a subject that is currently Uncleared
      if (subject.grade.includes("F") || subject.grade.includes("ABS")) {
        activeCarryOvers.push({
          sem: semData.semester,
          cop: subject.code,
          name: subject.name
        });
      }
    });
  });

  // 4. Find the latest semester safely (Numeric Sort: sem10 > sem2)
  const semKeys = Object.keys(semestersData);
  semKeys.sort((a, b) => parseInt(a.replace('sem', '')) - parseInt(b.replace('sem', '')));
  
  const latestSemKey = semKeys.length > 0 ? semKeys[semKeys.length - 1] : null;
  const latestSemesterData = latestSemKey ? semestersData[latestSemKey] : null;

  // 5. Extract COPs specific to the LATEST semester ONLY
  let latestCOPString = "NO Backlogs";
  if (latestSemesterData) {
    const latestSemCOPs = activeCarryOvers.filter(c => c.sem === latestSemesterData.semester);
    if (latestSemCOPs.length > 0) {
      latestCOPString = latestSemCOPs.map(c => c.cop).join(", ");
    }
  }

  // 6. Format final payload
  const finalCarryOvers = activeCarryOvers.length > 0 ? activeCarryOvers : ["No Backlogs"];

  return {
    rollNo,
    enrollmentNo,
    fullName,
    fatherName,
    course,
    branch,
    instituteName: institute,
    cgpa,
    division,
    totalMarksObtained: totalMarksAllSemesters,
    latestResultStatus: latestSemesterData ? latestSemesterData.resultStatus : "N/A",
    latestCOP: latestCOPString, // Strict: Only the current semester's failures
    CarryOvers: finalCarryOvers, // Strict: Only currently uncleared subjects
    semesters: semestersData
  };
}


// // Execution block
// (async () => {
//     const dataPromise = await solver(2400680310074);
//   console.log("\n--- FINAL PARSED JSON ---");
//   fs.writeFileSync("result.json", JSON.stringify(dataPromise, null, 2));
  
//     console.log(JSON.stringify(dataPromise, null, 2));
// })();