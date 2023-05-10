# Notes

Needs Python 3.11.3 or higher
Needs Node.js v12.18.4 or higher
The versions aren't super strict and you can probably get away with lower but those are what I have

Use `pip3 install libraryName` for all libraries that python says is missing
Use `npm install libraryName` for all libraries that javascript says is missing
You can do the package installing as you go if you prefer

The files are somewhat organized alphabetically 
-> earlier-run/created files start with an earlier letter than later-run/created files

If you want to save imgur links from other spreadsheets, download them as csv's and add them to the Sheets folder and rerun Step 6 onwards.

# Steps

1. Fork this Github Repo, then clone it to your local computer using git

2. Make an imgur.com account and get an imgur clientId and clientSecret at https://api.imgur.com/oauth2/addclient

3. Make a cloudinary.com account and get your cloudName, apiKey, and apiSecret. You can find these by using the sidebar to go to `Programmable Media > Dashboard`. You can generate a new apiKey and apiSecret by going to `Settings > Access Keys`.

4. Add a file called `DONT_SHARE_SECRETS.json` and add the following code inside and fill in the right values for each key. You can skip adding a value for GithubPagesSiteBaseURL for now:

```json
{
    "ImgurClientId": "",
    "ImgurClientSecret": "",
    "CloudinaryCloudName": "",
    "CloudinaryApiKey": "",
    "CloudinaryApiSecret": "",
    "GithubPagesSiteBaseURL": ""
}
```

5. Open the Arras WRA spreadsheet and then go to Extensions > Apps Script

6. Paste export_sheets_as_csv_to_folder.gs into a new script file, and change the UPPERCASE_VARIABLES at the top to the right values and then use the Run button to run the function `export_sheets_as_csv_to_folder()`

7. Now go to your Google Drive and download the folder that the previous script created

8. Copy that folder into this directory, at the same level as this README.md file

9. Rename that folder to "Sheets"

10. Run extractImgurLinks.py by typing `python3 extractImgurLinks.py` in your terminal. This will create/overwrite `foundImgurLinks.json`, which will contain a giant list of every unique non-gallery imgur link on the sheet. Edit the script if needed to replace weird link formats with their better forms (look at code for examples).

11. Run getImgurLinksWithoutAccounts.py with `python3 getImgurLinksWithoutAccounts.py` in the terminal. This will take a while to run because I'm too lazy to make it async. This will generate hashmapOfImgurLinkToItsDirectImageLinks.jsonl which is a jsonlines file (not plain json). Each line of it contains a json object where a single imgur link points to an array of all direct image links corresponding to it. For albums, this is all the direct image links within the album. For images, this is a 1-item array of the image itself as a direct link. Links that look like 'https://imgur.com/bCQxpva' are not albums but single-image links and they point to a 1-item array containing the DIRECT image link of the image at the original link.

12. Rerun the step above to try and get a few more links into the output file because they may have failed for a random reason before. Also, go through the failed links in the terminal output and click them to see which ones are actual 404 image not found links. Add those links to the variable `known404Links` in the script with each link on its own line.

13. In `massUploadImagesToCloudinary.js` change CONTAINER_FOLDER_NAME at the top to change which folder images will be uploaded into in cloudinary. Then, run `node massUploadImagesToCloudinary.js` to upload the imgur images into cloudinary. This will also generate newLinks.jsonl which is a file where each line represents one of the direct image links found in the previous step. You may need to rerun this file a few times if you get some images failing because it just screws up on occasion and that can be fixed with a rerun.

NOTE: 22,250 images took up about 3.03 GB; 110 mp4 videos took up about 2.80 GB

14. Log into your Cloudinary account and follow the instructions here to ensure your client side asset lists are enabled. Make sure to save your settings changes: 
https://cloudinary.com/documentation/product_gallery#prerequisite_make_sure_client_side_asset_lists_are_enabled
 
15. Confirm that your images and videos have been successfully uploaded into Cloudinary using the UI

16. Go back to your forked Github Repo and go to `Settings > Pages`. For "Source" choose "Deploy from a branch". For "Branch", choose "main". Next, choose "/root" NOT /docs and finally hit the save button. Wait for a minute or two and you should see the URL for your published Github Pages site show up. It should look something like "https://road6943.github.io/Arras-Wra-Imgur-Backups/" and you should copy & paste that URL into `DONT_SHARE_SECRETS.json` as the value for GithubPagesSiteBaseURL. Make sure to paste the entire URL including the https stuff at the beginning and the slash at the end.

17. In `prepareReplacementsDict.py` edit the variable `niceFormatLinksToTheirWeirdFormatOriginals` to add any replacements you did in `extractImgurLinks.py`

18. Run `python3 prepareReplacementsDict.py` and make sure there's no errors or error messages in the terminal. This will create `replacements.json` which is a giant json file that maps old imgur links on the sheet to their new replacement links. It will also create `urlsThatDontNeedReplacing.json` which is a list of imgur links that already have accounts associated. If error messages show up in the terminal, then investigate further and fix the problem then rerun the current step.

19. In your forked Github Repo, upload your new replacements.json so that the following Apps Script can fetch it and use it. Don't change its name or anything, it must appear at the correct url, something like "https://raw.githubusercontent.com/Road6943/Arras-Wra-Imgur-Backups/main/replacements.json". If you don't want to upload json to github, you can host it at npoint.io (make sure to lock the data after you paste it!). Once posted, use the share button to get the api link.

20. Repeat the above step for `urlsThatDontNeedReplacing.json`

21. In wipeOldImgurLinksAndAddNewLinks.gs change REPLACEMENTS_FILE_URL and URLS_THAT_DONT_NEED_REPLACING_FILE_URL to be the raw github or npoint api urls for their respective files, similar to the links in the previous two steps.

22. In the same Apps Script file, paste the known404Links from `getImgurLinksWithoutAccounts.py` into the KNOWN_404_LINKS variable in the Apps Script file.

23. You may also want to replace the url in this line (search for it) - `else if (cellValue.includes("road6943.github.io/Arras-Wra-Imgur-Backups")) continue;` - with your github pages link if you have one. Leave the `https://www.` part at the beginning out of this line.

24. Open the Arras WRA spreadsheet and then go to Extensions > Apps Script

25. Paste wipeOldImgurLinksAndAddNewLinks.gs into a new script file and change the extension to .gs

26. Make sure the variable DO_REPLACING_FOR_REAL at the top is false and use the Run button to run the function `ReplaceImgurLinks()`. This will print any non-replacable imgur links to the Execution Log. Individually find each link on the sheet and do what you need to for each one.

27. Once you've taken care of all the un-replacable imgur links, set DO_REPLACING_FOR_REAL to true, and run `ReplaceImgurLinks()` again. You should see the Execution Log output showing each sheet as it gets updated. Once the script finishes running, go through the sheet and make sure nothing went obviously wrong and you should be all good!