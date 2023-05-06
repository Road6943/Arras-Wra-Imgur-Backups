// In Google Apps Script, change extension to .gs not .js
/* 
  This file is part of a project to replace imgur links on the sheet not associated with an account because Imgur is going to delete them
  on May 15 2023. You can find more details at https://github.com/Road6943/Arras-Wra-Imgur-Backups

  Most code in this file is from this StackOverflow answer: https://stackoverflow.com/a/66994922
  I added in these lines: 
    const YOUR_SHEET_ID = "1n9SJZYTgOXsAj_8Ho--ivzLFLffuYpZSPOGg_Xxn5m8";
    const YOUR_PREFERRED_FOLDER_NAME_IN_DRIVE = "ArrasWraSheets " + (new Date()).toLocaleString();
    if (!csv) { continue; }

  Run this file by pasting the code into a Google Apps Script file in your Spreadsheet,
    and then changing YOUR_SHEET_ID and YOUR_PREFERRED_FOLDER_NAME_IN_DRIVE 
    and then running export_sheets_as_csv_to_folder() using the Run button
    (you may need to ensure the extension in Apps Script is .gs not .js)
*/

// Sheet id is in URL https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=IGNORE
const YOUR_SHEET_ID = "1n9SJZYTgOXsAj_8Ho--ivzLFLffuYpZSPOGg_Xxn5m8";
const YOUR_PREFERRED_FOLDER_NAME_IN_DRIVE = "ArrasWraSheets " + (new Date()).toLocaleString();

// https://stackoverflow.com/a/28711961
function export_sheets_as_csv_to_folder() {
  // Sheet id is in URL https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=IGNORE
  var ss = SpreadsheetApp.openById(YOUR_SHEET_ID);
  var sheets = ss.getSheets();
  if (sheets === undefined || sheets.length === 0) {
    return;
  }
  var passThroughFolder = DriveApp.createFolder(YOUR_PREFERRED_FOLDER_NAME_IN_DRIVE);
  for (var s in sheets) {
    var csv = convertRangeToCsvFile_(sheets[s])
    if (!csv) { continue; }
    passThroughFolder.createFile(sheets[s].getName() + ".csv", csv);
  }
}

// https://gist.github.com/mrkrndvs/a2c8ff518b16e9188338cb809e06ccf1
function convertRangeToCsvFile_(sheet) {
  // get available data range in the spreadsheet
  var activeRange = sheet.getDataRange();
  try {
    var data = activeRange.getValues();
    var csvFile = undefined;

    // loop through the data in the range and build a string with the csv data
    if (data.length > 1) {
      var csv = "";
      for (var row = 0; row < data.length; row++) {
        for (var col = 0; col < data[row].length; col++) {
          if (data[row][col].toString().indexOf(",") != -1) {
            data[row][col] = "\"" + data[row][col] + "\"";
          }
        }

        // join each row's columns
        // add a carriage return to end of each row, except for the last one
        if (row < data.length-1) {
          csv += data[row].join(",") + "\r\n";
        }
        else {
          csv += data[row];
        }
      }
      csvFile = csv;
    }
    return csvFile;
  }
  catch(err) {
    Logger.log(err);
    Browser.msgBox(err);
  }
}