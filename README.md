Needs Python 3.11.3

Make an imgur.com account and get an imgur clientId and clientSecret at https://api.imgur.com/oauth2/addclient

Use `pip3 install libraryName` for all libraries that python says is missing

# Steps

0. Add a file called `DONT_SHARE_SECRETS.json` and add the following code inside and fill in the right values for each key:

```json
{
    "ImgurClientId": "",
    "ImgurClientSecret": "",
    "CloudinaryCloudName": "",
    "CloudinaryApiKey": "",
    "CloudinaryApiSecret": ""
}
```

1. Open the Arras WRA spreadsheet and then go to Extensions > Apps Script

2. Paste export_sheets_as_csv_to_folder.gs into a new script file, and change the variables at the top to the right values and then use the Run button to run the function `export_sheets_as_csv_to_folder()`

3. Now go to your Google Drive and download the folder that the previous script created

4. Copy that folder into this directory, at the same level as this README.md file

5. Rename that folder to "Sheets"

6. Run extractImgurLinksAndCells.py by typing `python3 extractImgurLinksAndCells.py` in your terminal. This will create/overwrite `foundImgurLinks.json`, which will contain a giant list of every unique non-gallery imgur link on the sheet.

7. Run getImgurLinksWithoutAccounts.py with `python3 getImgurLinksWithoutAccounts.py` in the terminal. This will take a while to run because I'm too lazy to make it async. This will generate hashmapOfImgurLinkToItsDirectImageLinks.jsonl which is a jsonlines file (not plain json). Each line of it contains a json object where a single imgur link points to an array of all direct image links corresponding to it. For albums, this is all the direct image links within the album. For images, this is a 1-item array of the image itself as a direct link. Links that look like 'https://imgur.com/bCQxpva' are not albums but single-image links and they point to a 1-item array containing the DIRECT image link of the image at the original link.

8. 


# Notes

The files are somewhat organized alphabetically 
-> earlier-run/created files start with an earlier letter than later-run/created files

If you want to save imgur links from other spreadsheets, download them as csv's and add them to the Sheets folder and rerun Step 6 onwards.