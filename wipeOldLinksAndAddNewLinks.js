// set this to true to actually do the replacing
const DO_REPLACING_FOR_REAL = false;

const REPLACEMENTS_FILE_URL = "https://raw.githubusercontent.com/Road6943/Arras-Wra-Imgur-Backups/main/replacements.json";
const URLS_THAT_DONT_NEED_REPLACING_FILE_URL = "https://raw.githubusercontent.com/Road6943/Arras-Wra-Imgur-Backups/main/urlsThatDontNeedReplacing.json";

// stuff like HAS because HAS Calculations controls it
const SHEETS_TO_SKIP = new Set([
  "WR Rules & Info", // pulls from records (was used by the old wra website)
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
https://imgur.com/a/TbL2F2U
https://imgur.com/a/GWCrjkP
https://imgur.com/a/WDfksz9
https://imgur.com/a/cv5azHt
https://imgur.com/a/696969
https://imgur.com/a/fEIWdEI
https://imgur.com/a/UmfLhCO
https://imgur.com/a/JAIYiTJ
`.split("\n").map(line => line.trim()));

function ReplaceImgurLinks() {
  const replacements = JSON.parse(UrlFetchApp.fetch(REPLACEMENTS_FILE_URL));
  const urlsThatDontNeedReplacing = new Set(JSON.parse(UrlFetchApp.fetch(URLS_THAT_DONT_NEED_REPLACING_FILE_URL)));
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // this is the backup for when a simple setValues call on the dataRange doesn't work
  // then we will iterate through this and individually setValue each cell
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
        let cellValue = sheetValues[row][col].toString().trim();

        // remove query params at the end 
        cellValue = cellValue.split("?")[0]

        if (cellValue === "") continue;
        else if (!cellValue.includes("imgur.")) continue;
        else if (cellValue.includes("/gallery/")) continue;
        else if (cellValue.includes("road6943.github.io/Arras-Wra-Imgur-Backups")) continue;
        else if (urlsThatDontNeedReplacing.has(cellValue)) continue;
        
        if (KNOWN_404_LINKS.has(cellValue)) {
          const brokenLinkReplacement = "[Proof Expired]";
          sheetValues[row][col] = brokenLinkReplacement;

          swapsToMake[sheetName].push({
            row: row+1, // 0 index -> 1 index
            col: col+1,
            oldLink: cellValue,
            newLink: brokenLinkReplacement,
          });

          continue;
        }

        // and the more minor stuff like deleted links should just be ignored as there's no way to keep them up to date when new files are added

        //console.log(cell + " :: " + sheet.getName());
        if (!(cellValue in replacements)) {
          // 0 index -> 1 index
          const colLetter = colNum0IndexToLetter(col);
          console.log(`${cellValue} couldn't be replaced! It's in ${sheetName} at row ${row+1}, col ${colLetter}`)
        } else {
          // modify sheetValues so we can do a giant setValue call later
          sheetValues[row][col] = replacements[cellValue];

          // backup for if giant setValue doesn't work
          swapsToMake[sheetName].push({
            row: row+1, // 0 index -> 1 index
            col: col+1,
            oldLink: cellValue,
            newLink: replacements[cellValue],
          });
        }
      }
    }
    
    // only do replacing when this var is true
    if (!DO_REPLACING_FOR_REAL) { continue; }

    // Do the actual replacing
    try {

      // first, try a simple giant setValues call of the modified 2d array
      dataRange.setValues(sheetValues);
      console.log(`Replaced all imgur links in ${sheetName}`);

    } catch {

      // if the above fails, iterate through each individual swap and set each cell value separately
      for (const swap of swapsToMake[sheetName]) {
        sheet.getRange(swap.row, swap.col).setValue(swap.newLink);
      }

      console.log(`Individually replaced all imgur links in ${sheetName}`);
    }
  }
}

// https://stackoverflow.com/a/71713806
function colNum0IndexToLetter(zeroIndexedColNum) {
  const res = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[zeroIndexedColNum % 26];
  return zeroIndexedColNum >= 26 ? colNum0IndexToLetter(Math.floor(zeroIndexedColNum / 26) - 1) + res : res;
}