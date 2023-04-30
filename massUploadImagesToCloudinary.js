// using node js bc python's async await stuff is too much work to learn

// set to 0 for none, but that may overload the api
const TIME_DELAY_BETWEEN_API_CALLS_IN_SECONDS = 0.01

const outputFilename = "newLinks.jsonl";


const fs = require('fs');
const cloudinary = require('cloudinary').v2;

function readInputFile() {
    const inputFilename = "hashmapOfImgurLinkToItsDirectImageLinks.jsonl";
    const inputData = {};

    const inputFileContents = fs.readFileSync(inputFilename, "utf-8");
    for (let line of inputFileContents.split("\n")) {
        line = line.trim();
        if (line.length === 0) continue; // skip empty line

        // 1 obj per line, 1 key per obj
        let obj = JSON.parse(line);
        for (let key in obj) {
            inputData[key] = obj[key];
        }
    }
    
    return inputData;
}

// output file be jsonlines
// each line will be { oldImgurLink:"", newLink:"",  oldParentLink:"" , tag:""}
// oldParentLink is the thing on the left side of the jsonl line
// tag is the oldParentLink converted to base64 - it helps the Product Gallery find the images in a certain folder
// only the direct image links on the right side of the previous jsonl file will get a row in this one
function readOutputFile(inputData) {
    // stores strings in format oldImgurLink + oldParentLink
    // because theres a couple duplicate direct links that appear both in an album and on their own
    // theres not many so its better to just upload them again each time they appear
    const seenImgurLinks = new Set();

    // if output file doesn't exist, create it
    if (!fs.existsSync(outputFilename)) {
        fs.writeFileSync(outputFilename, ""); // make empty file
    }

    const outputFileContents = fs.readFileSync(outputFilename, "utf-8");
    for (let line of outputFileContents.split("\n")) {
        line = line.trim();
        if (line.length === 0) continue; // skip empty line

        let { oldImgurLink, oldParentLink } = JSON.parse(line);
        seenImgurLinks.add(oldImgurLink + oldParentLink);
    }

    return seenImgurLinks;
}

// Node js doesn't have btoa but browser does
// converts string to base64
function toBase64(string) {
    return Buffer.from(string).toString('base64');
}

async function uploadImgurImagesToCloudinary(inputData, seenImgurLinks) {
    let secrets = fs.readFileSync("DONT_SHARE_SECRETS.json", "utf-8");
    secrets = JSON.parse(secrets);
    
    cloudinary.config({
        cloud_name: secrets.CloudinaryCloudName,
        api_key: secrets.CloudinaryApiKey,
        api_secret: secrets.CloudinaryApiSecret
    });
    
    const failedLinks = [];
    let numLinksUploaded = seenImgurLinks.size;
    
    let totalLinksToUpload = 0;
    for (const key in inputData) {
        totalLinksToUpload += inputData[key].length;
    }

    let i = 0; // for testing purposes only

    for (const oldParentLink in inputData) {
        const childLinks = inputData[oldParentLink];

        // album links that already have an account and won't be deleted
        if (childLinks.length === 0) {
            continue;
        }

        const oldParentLinkBase64 = toBase64(oldParentLink);
        
        for (const oldImgurLink of childLinks) {
            // skip links that have already been uploaded
            if (seenImgurLinks.has(oldImgurLink + oldParentLink)) continue;

            // convert the link to base64 for a url-safe and cloudinary id safe string
            const oldImgurLinkBase64 = toBase64(oldImgurLink);
            
            try {
                // slow down api calls
                await new Promise(resolve => setTimeout(resolve, 1000 * TIME_DELAY_BETWEEN_API_CALLS_IN_SECONDS));

                let resourceType = 'image';
                if (oldImgurLink.endsWith('mp4')) {
                    resourceType = 'video';
                }

                const res = cloudinary.uploader.upload(oldImgurLink, {
                    // You can specify the folder path in the public id field
                    // Store each image in the folder of its parent link
                    public_id: `ArrasWraImgurBackups/${oldParentLinkBase64}/${oldImgurLinkBase64}`,
                    tags: [ oldParentLinkBase64 ], // makes it easier for product gallery to get all images
                    resource_type: resourceType
                });

                res.then(async (data) => {

                    // append json line to file
                    await fs.promises.appendFile(outputFilename, JSON.stringify({
                        oldParentLink, oldImgurLink, newLink: data.secure_url, tag: oldParentLinkBase64
                    }) + "\n", (err) => {
                        failedLinks.push(oldImgurLink);
                    });

                    console.log(`Link ${++numLinksUploaded} of ${totalLinksToUpload} :: ${oldImgurLink}\n=> ${data.secure_url}\n`)

                }).catch((err) => {

                    console.log(err)
                    failedLinks.push(oldImgurLink);

                });

            } catch(err) {

                failedLinks.push(oldImgurLink);
                console.log(err.message);

            }
        }

        //if (++i >= 1000) break; // todo remove, helps limit how many links are uploaded when testing
    }

    console.log("FAILED IMGUR LINK UPLOADS:")
    for (const failedLink of failedLinks) {
        console.log("FAILED LINK: " + failedLink);
    }
}

async function main() {
    const inputData = readInputFile();
    const seenImgurLinks = readOutputFile();
    await uploadImgurImagesToCloudinary(inputData, seenImgurLinks);
}

main();