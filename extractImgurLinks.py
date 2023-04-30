# run in terminal with:
# python3 extractImgurLinks.py

SHEETS_FOLDER_NAME = "Sheets"

####################################
import os, csv, json
from typing import Dict, Set

# The set contains all imgur links found across all CSV Files
# I do it like this instead of organizing by sheet because many sheets have common files
# so this reduces how much downloading/uploading of images is needed
imgurLinks = set()

# open every csv file in the folder
filesToSkip = [
    "WR Rules _ Info.csv", # has stuff from when I made the actual website, its all on other sheets tho so its not needed
                            # also, the links have "[\"" in them which is annoying and the links already exist elsewhere
    "Min_Max Records.csv",

    # update, this only reduces it to 3300, might as well leave them in
    #"Highest Arras Scores.csv", # TODO Remove HAS and HAS_Calc from here
    #"HAS_Calculations.csv", # I'm only temp leaving them here bc they're 5100/5500 links
]

for csvFilename in os.listdir(SHEETS_FOLDER_NAME):
    if csvFilename in filesToSkip:
        continue

    csvFilepath = os.path.join(SHEETS_FOLDER_NAME, csvFilename)
    with open(csvFilepath, 'r') as file:
        # iterate across the current csv file, and if 'imgur.com' is in a cell,
        # then add that cell's contents to the imgurLinks set
        csvreader = csv.reader(file)
        for row in csvreader:
            for cell in row:
                cell = cell.strip()

                # remove the query params from end of url
                if '?' in cell:
                    cell = cell.split('?')[0]

                # links I've come across that break stuff
                invalidLinks = ["https://imgur.com/", 
                                "https://imgur.com/sr219f0fc086031.gif", # deleted
                                "https://imgur.com/tCWsyX4p", # id has 1 extra char and I'm not sure what the og link is bc all possibilities lead to 404 error
                                ]
                if 'imgur.com' in cell and cell not in invalidLinks:
                    # a special case, add the i. to the start
                    # This link is in WR Rules _ Info.csv and so may not be in final output
                    # because that csv is usually ignored
                    if "https://imgur.com/TWfwVPN.png" in cell:
                        cell = "https://i.imgur.com/TWfwVPN.png"

                    # gallery links seem to always be associated with an account
                    # so I think they'll be safe from deletion
                    if "/gallery/" in cell:
                        continue

                    # the rest of the links from here out should be either
                    # /a/ links or i.imgur.com direct image links
                    # or the other album format without /a/ like https://imgur.com/DmDMweT
                    # detect if any image links dont match those 3 patterns and print them
                    # to alert user
                    if ('/a/' not in cell) and ('i.imgur.com' not in cell):
                        withoutImgur = cell.replace('https', 'http').replace('http://imgur.com/', '')
                        if len(withoutImgur) != 7: # link id at end should be 7 chars
                            print(f"UNUSUAL PATTERN: {withoutImgur}")


                    imgurLinks.add(cell)

# dump imgurLinks dict into a json file
OUTPUT_JSON_FILE_NAME = "foundImgurLinks.json"
with open(OUTPUT_JSON_FILE_NAME, 'w') as outputFile:
    json.dump(list(imgurLinks), outputFile)

