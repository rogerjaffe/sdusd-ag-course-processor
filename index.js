const fs = require("fs");
const { parse } = require("papaparse");
const CSV_FILE_NAME = "./uc-doorways-list-2023-09-14.csv";
const FIELD_NAMES = {
  college_board_id: 0,
  school_name: 1,
  course_record_id: 2,
  course_title: 3,
  transcript_abbreviation: 4,
  course_number: 5,
  course_length: 6,
  subject_area: 7,
  discipline: 8,
  uc_honors: 9,
  cte_industry_sector: 10,
  cte_pathway: 11,
  school_code: 12,
};

// Parse raw CSV file into an array of arrays
const fieldNames = Object.keys(FIELD_NAMES);
const csv = fs.readFileSync(CSV_FILE_NAME, "utf8");
const { data: lines } = parse(csv);
console.log("Raw file parsed");

// Remove top line
lines.shift();
console.log("Dump header row");

const courses = lines.map((line, idx) => {
  // Parse subject area to 'a' through 'g' abbreviation only
  const pos = line[FIELD_NAMES["subject_area"]].indexOf("(");
  line[FIELD_NAMES["subject_area"]] = line[FIELD_NAMES["subject_area"]]
    .substring(pos + 1, pos + 2)
    .toLowerCase();

  // Split course numbers into separate lines
  const courseNumbers = line[FIELD_NAMES["course_number"]]
    .replaceAll(" ", "")
    .replaceAll("(firstsemester)", ",")
    .replaceAll("(secondsemester)", "")
    .replaceAll("and", ",")
    .split(/,|\/|-/);
  return courseNumbers.map((cn) => {
    const newLine = [...line];
    newLine[FIELD_NAMES["course_number"]] = cn;
    return newLine;
  });
});
console.log("Parse subject are and split course numbers");

// Convert 2D array into a CSV string and save to file for
// import into the osps_ag_courses MySQL table
let flattenedCourses = courses.flat();
console.log("Flatten courses");

flattenedCourses = flattenedCourses.map((c, idx) => {
  c.splice(0, 0, idx + 1);
  return c;
});
console.log("Add ID column");

const flattenedCsv = flattenedCourses.map(
  (line) => '"' + line.join('","') + '"',
);
fieldNames.splice(0, 0, "id");
const header = '"' + fieldNames.join('","') + '"';
flattenedCsv.splice(0, 0, header);
const flat = flattenedCsv.join("\n");
console.log("Join courses");

fs.writeFileSync("./uc-doorways-list-2023-09-14-flattened.csv", flat, "utf8");

console.log("Preprocessor complete");
console.log(`${courses.length} original rows`);
console.log(`${flattenedCourses.length} flattened rows`);
