const REPLACEMENTS_FILE_URL = "https://raw.githubusercontent.com/Road6943/Arras-Wra-Imgur-Backups/main/replacements.json";
const URLS_THAT_DONT_NEED_REPLACING_FILE_URL = "https://raw.githubusercontent.com/Road6943/Arras-Wra-Imgur-Backups/main/urlsThatDontNeedReplacing.json";

// stuff like HAS because HAS Calculations controls it
const SHEETS_TO_SKIP = new Set([
  "WR Rules & Info", // 
  "Highest Arras Scores", // pulls from HAS Calculations
  "Top 100", // pulls from HAS Calculations
  "Player/Tank Stats", // no imgur links
  "Legacy Arras Scores", // pulls from HAS Calculations
  "Event Arras Scores", // pulls from HAS Calculations
  "Discord IDs", // no imgur links
  "Min/Max Records", // pulls from Records
  "Event_Calculations", // no imgur links
  "New_Calculations", // no imgur links
  "Incog_Calculations", // no imgur links
  "1717462797", // no imgur links
  "Charts/Graphs", // no imgur links
]);

function SwapImgurLinksWithNewLinks() {
  const replacements = JSON.parse(UrlFetchApp.fetch(REPLACEMENTS_FILE_URL));
  const urlsThatDontNeedReplacing = new Set(JSON.parse(UrlFetchApp.fetch(URLS_THAT_DONT_NEED_REPLACING_FILE_URL)));
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  for (const sheet of ss.getSheets()) {
    if (SHEETS_TO_SKIP.has(sheet.getName().trim())) continue;

    const dataRange = sheet.getDataRange();
    const sheetValues = dataRange.getValues();
    // js array is 0-indexed but the actual sheet is 1-indexed so convert properly
    for (let row = 0; row < sheetValues.length; row++) {
      for (let col = 0; col < sheetValues[row].length; col++) {
        const cell = sheetValues[row][col].toString().trim();

        if (cell === "") continue;
        else if (!cell.includes("imgur.")) continue;
        else if (cell.includes("/gallery/")) continue;
        else if (cell.includes("road6943.github.io/Arras-Wra-Imgur-Backups")) continue;
        else if (urlsThatDontNeedReplacing.has(cell)) continue;

        // and the more minor stuff like deleted links should just be ignored as there's no way to keep them up to date when new files are added

        //Logger.log(cell + " :: " + sheet.getName());
        if (!(cell in replacements)) {
          Logger.log(`#${cell}#` + " NOT in replacements")
        }
      }
    }

  }

  // instead of cell by cell might be faster to do a getvalues and track the row/col of each replacement in a data structure
  // and then go through and replace them all at once
  // you can store the stuff you've been through in an external json like before to make this go past 6min limit if needed
}


