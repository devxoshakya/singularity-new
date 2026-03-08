import { stringify } from "qs"; // for form encoding with nested data
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
    const parseData = parseHTML(JSON.stringify(await response.text()));
    // console.log(parseData);
    return parseData;
  } catch (error) {
    console.error("Error:", error);
  }
}

function cleanString(str: string) {
  return str.replace(/\\r|\\n/g, "").trim();
}

function parseHTML(htmlContent: string) {
  const $ = cheerio.load(htmlContent);
  const rollNo =
    $('td:contains("RollNo")').next().next().text().trim() || "N/A";
  const name =
    $('td:contains("Institute Code")')
      .next()
      .next()
      .text()
      .replace(/[0-9()]/g, "")
      .trim()
      .replace(/[\n\r\t]/g, "") || "N/A";

  const enrollmentNo =
    $('td:contains("EnrollmentNo")').next().next().text().trim() || "N/A";


  const branch =
    $('td:contains("Branch Code")')
      .next()
      .next()
      .text()
      .replace(/[0-9()]/g, "")
      .trim() || "N/A";
  const fullName =
    $('td:contains("Name")')
      .next()
      .next()
      .text()
      .replace(/[0-9()]/g, "")
      .trim()
      .replace(/[\n\r\t]/g, "") || "N/A";
  const names = fullName
    .split(/\s\s+/)
    .map((name) => name.trim())
    .filter((name) => name);
  const firstName = names[9];

  const fatherName = $('td:contains("Father")').next().next().text().trim() || "N/A";

  const course = $('td:contains("Course Code")').next().next().text().replace(/[0-9()]/g, "").trim() || "N/A";

  let semesters: { [key: string]: number } = {};

  $('[id*="forlblSemesterId"]').each((i, elem) => {
    let semester = $(elem)
      .closest("tr")
      .find('[id*="lblSemesterId"]')
      .text()
      .replace(/[A-Za-z]/g, "")
      .trim();

    let sgpa =
      $(elem)
        .closest("tr")
        .next()
        .next()
        .next()
        .find('[id*="lblSGPA"]')
        .text()
        .trim() || "N/A";

    let sgpaValue = parseFloat(sgpa);

    if (sgpa !== "N/A" && sgpaValue !== 0) {
      semesters[`sem${semester}`] = sgpaValue;
    }
  });

  const CarryOvers: any = [];
  for (let i = 4; i <= 15; i++) {
    $(`span[id*="ctl0${i}_lblCOP"]`).each((_, element) => {
      const cop = $(element).text().trim(); // Extract COP value
      if (cop) {
        const session = $(element)
          .closest('div') // Find the parent div containing COP and session info
          .find(`span[id*="ctl0${i}_lblSession"]`) // Locate session span
          .text()
          .replace('Session :', '')
          .trim();
        const sem = $(element).
          closest('div') // Find the parent div containing COP and session info
          .find(`span[id*="ctl0${i}_lblSem"]`) // Locate semester span
          .text()
          .replace('Sem :', '')
          .trim();

        if (cop !== "COP :") {
          CarryOvers.push({ session, sem, cop });
        }
      }
    });
  }
  const divison = $('span[id*="lblDivisionAwarded"]').text().trim();
  const cgpa = $('span[id*="lblFinalMO"]').text().trim();

  if (CarryOvers.length === 0) {
    CarryOvers.push(["No Backlogs"]);
  }

  let latestResultStatus = "N/A";
  let totalMarksObtained = 0;
  let latestCOP = "NO Backlogs";
  const Subjects: any = [];
  for (let i:any = 15; i >= 4; i--) {
    if(i<10){
      i = `0${i}`;
    }
    let sem_ = 1;
    const flag = $(`span[id*="ctl${i}_ctl00_ctl00_grdViewSubjectMarksheet_subName_0"]`).text().trim();
    const flag2 = $(`span[id*="ctl${i}_ctl01_ctl00_grdViewSubjectMarksheet_subName_0"]`).text().trim();
    
    if (flag === "" && flag2 === "") {
      continue;
    }
    if (flag !== "") {
      sem_ = 1;
    }
    if (flag2 === "") {
      sem_ = 0;
    }

    latestResultStatus = $(`span[id*="ctl${i}_lblResult"]`).text().trim();
    totalMarksObtained = parseInt($(`span[id*="ctl${i}_ctl0${sem_}_lblSemesterTotalMarksObtained"]`).text().trim());
    latestCOP = $(`span[id*="ctl${i}_lblCOP"]`).text().trim();

    for (let j = 0; j < 10; j++) {
      const subject = $(`span[id*="ctl${i}_ctl0${sem_}_ctl00_grdViewSubjectMarksheet_subName_${j}"]`).text().trim();
      const code = $(`span[id*="ctl${i}_ctl0${sem_}_ctl00_grdViewSubjectMarksheet_subCode_${j}"]`).text().trim();
      const type = $(`span[id*="ctl${i}_ctl0${sem_}_ctl00_grdViewSubjectMarksheet_subType_${j}"]`).text().trim();
      const internal = $(`span[id*="ctl${i}_ctl0${sem_}_ctl00_grdViewSubjectMarksheet_subType_${j}"]`).closest('td').next().text().trim();
      const external = $(`span[id*="ctl${i}_ctl0${sem_}_ctl00_grdViewSubjectMarksheet_subType_${j}"]`).closest('td').next().next().text().trim();
      const latest = $(`span[id*=ctl${i}_lblSem"]`).text().trim();

      if (subject !== "" && code !== "") {
        Subjects.push({ subject, code, type, internal, external });
      }
    }

    break;
  }

  if (
    rollNo === "N/A" ||
    name === "N/A" ||
    branch === "N/A" ||
    fullName === "N/A"
  ) {
    return null;
  }

  return {
    rollNo: cleanString(rollNo),
    enrollmentNo: cleanString(enrollmentNo),
    fullName: cleanString(firstName || fullName),
    fatherName: cleanString(fatherName),
    course: cleanString(course),
    branch: cleanString(branch),
    SGPA: semesters,
    CarryOvers: CarryOvers,
    divison: cleanString(divison),
    cgpa: cleanString(cgpa),
    instituteName: cleanString(name),
    Subjects: Subjects,
    latestResultStatus: cleanString(latestResultStatus),
    totalMarksObtained: totalMarksObtained,
    latestCOP: cleanString(latestCOP),
  };
}



// const dataPromise = await solver(2300680100119);
// console.log(dataPromise);