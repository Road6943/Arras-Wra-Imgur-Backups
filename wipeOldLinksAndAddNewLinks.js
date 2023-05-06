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

const KNOWN_404_LINKS = new Set(`
  https://imgur.com/nxLpAD4
  https://imgur.com/a/h1G5vzM
  https://imgur.com/a/epjDjZu
  https://imgur.com/a/cMGVaHz
  https://imgur.com/a/ipvgkOv
  https://imgur.com/a/OsIjGOs
  https://imgur.com/a/fzwtClp
  https://imgur.com/kt8heKr
  https://imgur.com/a/6nnS2tK
  https://imgur.com/PvvbqT5
  https://imgur.com/XdHoY8Q
  https://imgur.com/a/OdANkqX
  https://imgur.com/a/wkbiCeo
  https://imgur.com/a/NzCbe4b
  https://imgur.com/a/LobzfCC
  https://imgur.com/a/dCvnYex
  https://imgur.com/a/6iQKHI2
  https://imgur.com/a/B7OrVng
  https://imgur.com/a/jnxFMb0
  https://imgur.com/a/3mpi94j
  https://imgur.com/SuVuDQd
  https://imgur.com/a/gbdlZJP
  https://imgur.com/a/vxoLM0j
  https://imgur.com/jx7fyuA
  https://imgur.com/W5oGspb
  https://imgur.com/a/BOFNLHT
`.split("\n").map(line => line.trim()));

function WipeOldLinksAndAddNewLinks() {
  const replacements = JSON.parse(UrlFetchApp.fetch(REPLACEMENTS_FILE_URL));
  const urlsThatDontNeedReplacing = new Set(JSON.parse(UrlFetchApp.fetch(URLS_THAT_DONT_NEED_REPLACING_FILE_URL)));
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const swapsToMake = {}

  for (const sheet of ss.getSheets()) {
    const sheetName = sheet.getName().trim();
    if (SHEETS_TO_SKIP.has(sheetName)) continue;

    swapsToMake[sheetName] = [];

    const dataRange = sheet.getDataRange();
    const sheetValues = dataRange.getValues();
    // js array is 0-indexed but the actual sheet is 1-indexed so convert properly
    for (let row = 0; row < sheetValues.length; row++) {
      for (let col = 0; col < sheetValues[row].length; col++) {
        let cell = sheetValues[row][col].toString().trim();

        // remove query params at the end 
        cell = cell.split("?")[0];

        if (cell === "") continue;
        else if (!cell.includes("imgur.")) continue;
        else if (cell.includes("/gallery/")) continue;
        else if (cell.includes("road6943.github.io/Arras-Wra-Imgur-Backups")) continue;
        else if (urlsThatDontNeedReplacing.has(cell)) continue;
        
        if (KNOWN_404_LINKS.has(cell)) {
          // TODO maybe replace these with a blank cell?
          // actually replace them with something like [Proof Expired]
          continue;
        }

        // and the more minor stuff like deleted links should just be ignored as there's no way to keep them up to date when new files are added

        //console.log(cell + " :: " + sheet.getName());
        if (!(cell in replacements)) {
          console.log(`${cell} couldn't be replaced!`)
        } else {
          // do the actual replacing here TODO
          // https://developers.google.com/apps-script/reference/spreadsheet/sheet#getrangerow,-column
          // <sheet>.getRange(row,col) returns a single cell and both nums should be 1-indexed
          // instead of doing many getRange's it might be better to modify the js array instead and do 1 giant setRange for each sheet
          // currently exec times out 10% thru HAS Calculations - I think giant setvalues may be better
          // avoid breaking formulas: https://stackoverflow.com/questions/54775597/get-modify-set-values-without-breaking-formulas-in-google-sheet-with-scripts
          swapsToMake[sheetName].push({
            row: row+1, 
            col: col+1,
            newLink: replacements[cell],
          });
          // console.log(sheet.getRange(row+1,col+1).getValue());
        }
      }
    }

    console.log(swapsToMake[sheetName]);

  }

  // instead of cell by cell might be faster to do a getvalues and track the row/col of each replacement in a data structure
  // and then go through and replace them all at once
  // you can store the stuff you've been through in an external json like before to make this go past 6min limit if needed
}


