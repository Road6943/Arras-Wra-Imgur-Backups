// PROBLEM:
// Exceeded maximum execution time
// The limit is 6min, my script takes ~5min per 100 links so this won't be fine
// Theres about 5300 replacements to make
// https://inclu-cat.net/2021/12/14/an-easy-way-to-deal-with-google-apps-scripts-6-minute-limit/
// I'm testing on this copy of the sheet:
// https://docs.google.com/spreadsheets/d/13t7TS85Y46WqHppgoX53eMSRFNpkVtr--wje2yA6K8Q/edit#gid=1379322997
// It seems to be working so far but I should see if any issues arise later

// otherwise just do what I usually do:
// load data from somewhere with finished links and make a set
// skip links in set, but replace otherwise and then add to set
// I can do this in several ways:
// 1. (easiest) store links in a new sheet tab - be careful though since I don't want them to be extracted by the extractImgurLinks.py script
//    tho this may not be an issue since that py script makes a set anyways so duplicate links are taken care of
//    I could also add a readme step to make the new sheet an invalid one in extractImgurLinks.py
// 2. Properties service - this may run out of space tho, 9 KB per key/val pair, and i have over 5000 links so not enough
// 3. fetch to a url with a custom replit flask api that stores in replit db or another json file
//     https://dev.to/sandrarodgers/basic-express-server-using-replitcom-2ba9
//     I could make this with any language for the lolz like Kotlin with Ktor
//     but I could also just use flask/express because they're simple and have lots of docs and examples

// this file freezes my computer when copying and pasting, so I'll just fetch the latest json from the github url
const REPLACEMENTS_FILE_URL = "https://raw.githubusercontent.com/Road6943/Arras-Wra-Imgur-Backups/main/replacements.json";
// MAKE SURE TO DELETE THIS FILE BEFORE THE FIRST TIME YOU RUN THIS SCRIPT FOR A NEW SHEET!!!
const ALREADY_REPLACED_TRACKER_FILE_NAME = "AlreadyReplacedImgurLinksTracker.json";

// You can't do more than about 3000 items at a time so run the script multiple times
// and increase the slice by 3000 each time -> first do 0,3000 then do 3000,6000
// make sure the end of one slice == the start of the next because .slice(start,end) goes from start to end-1
const SLICE = [0,3000];



// ---------- DON'T EDIT BELOW UNLESS YOU KNOW WHAT YOU'RE DOING ------------

// GLOBAL VARIABLES bc LongRun's params argument must be a string array only
const sheet = SpreadsheetApp.getActiveSpreadsheet();
const [alreadyReplacedImgurLinks, alreadyReplacedTrackerFile] = getAlreadyReplacedImgurLinks();
let totalReplacementsToMake = -1; // for logging since the slice doesn't contain the full length


// returns [setOfLinks, trackerFile]
function getAlreadyReplacedImgurLinks() {
  let alreadyReplacedTrackerFile = null;

  const fileIterator = DriveApp.getFilesByName(ALREADY_REPLACED_TRACKER_FILE_NAME);
  if (fileIterator.hasNext()) {
    alreadyReplacedTrackerFile = fileIterator.next();
  }

  // if the file doesn't exist already, create it (aka the first time this function runs)
  // make it an empty json array
  if (alreadyReplacedTrackerFile === null) {
    alreadyReplacedTrackerFile = DriveApp.createFile(ALREADY_REPLACED_TRACKER_FILE_NAME, "[]");
  }

  const alreadyReplacedTrackerFileContents = alreadyReplacedTrackerFile.getBlob().getDataAsString();
  const alreadyReplacedImgurLinks = new Set( JSON.parse(alreadyReplacedTrackerFileContents) );
  
  return [alreadyReplacedImgurLinks, alreadyReplacedTrackerFile];
}


// start a LongRun because it will exceed the 6 minute script execution limit
// Learned how to use LongRun from this Reddit comment: 
// https://www.reddit.com/r/googlesheets/comments/rhw55x/comment/hozqtkx/?utm_source=share&utm_medium=web2x&context=3
function SwapImgurLinksWithNewLinks() {
  // get an object
  const replacementsObj = JSON.parse( UrlFetchApp.fetch(REPLACEMENTS_FILE_URL) );
  // convert to array of [k,v] arrays and sort to ensure same order always
  let replacementsList = Object.entries(replacementsObj).sort()
  totalReplacementsToMake = replacementsList.length;
  replacementsList = replacementsList.slice(...SLICE); // we can only process ~3000 items at a time
  
  // params must be a list of strings so temporarily convert to a string array and re-split it later
  const params = replacementsList.map(keyValPair => {
    const [oldLink, newLink] = keyValPair;
    return `${oldLink} ### ${newLink}`;
  });

  const loopCount = replacementsList.length;

  executeLongRun("main", loopCount, params, "initializer", "finalizer");
}

function initializer(startIndex, params) {}

function main(index, params) {
  // split the string back into separate links
  let [oldLink, newLink] = params[index].split(" ### ").map(str => str.trim());

  // skip already replaced links
  if (alreadyReplacedImgurLinks.has(oldLink)) {
    Logger.log(`Skipping ${oldLink}`);
    return;
  }

  try {
    const textFinder = sheet.createTextFinder(oldLink);
    // this does the actual replacing
    const numOccurencesOfOldLink = textFinder.replaceAllWith(newLink);

    // append to json file
    alreadyReplacedImgurLinks.add(oldLink);
    alreadyReplacedTrackerFile.setContent( JSON.stringify(Array.from(alreadyReplacedImgurLinks)) );

    Logger.log(`${alreadyReplacedImgurLinks.size}/${totalReplacementsToMake} Replaced ${numOccurencesOfOldLink} occurences of ${oldLink} with ${newLink}`);

  } catch(err) {
    Logger.log(`Error with link ${oldLink}`);
    Logger.log(err.message);
  }
}

function finalizer(isFinished, params) {}


