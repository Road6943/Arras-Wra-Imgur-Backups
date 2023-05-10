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

# links I've come across that break stuff
invalidLinks = set([
    "https://imgur.com/", 
    "http://imgur.com",
    "https://imgur.com/sr219f0fc086031.gif", # deleted
    "https://imgur.com/tCWsyX4p", # id has 1 extra char and I'm not sure what the og link is bc all possibilities lead to 404 error
    "imgur.com",
    "https://imgur.com/query",
    "https://imgur.com/undefined",
    "https://imgur.com/2"
    "https://imgur.com/upload",
    "https://imgur.com",
    "https://imgur.com/register",
    "https://imgur.com/ee",
    "https://imgur.com/edit",
    "https://imgur.com/roghadsexwiththing",
    "https://imgur.com/kuromi",
    "https://imgur.com/praise_allah",
    "https://imgur.com/upload",
    "https://www.imgur.com",
    "https://community.imgur.com/t/3-7m-artillery-wr/70199",
    "https://barricadegod45.imgur.com/all/",
    "https://www.imgur.com/r/Arrasio/comments/r4xwio/my_first_2m_221m_healer/",
    "Something happened to the imgur... and it doesnt work anymore, so im resubmitting with a new link",
    "https://imgur.com/aa/f/f/f/r/r/r/r",
    "https://frisbeemaksim.imgur.com/all/",
    "blob:https://imgur.com/f26a3e32-698f-471f-a557-45fba429087d",
    "https://imgur.com/user/ejv10/posts",
    "https://bobbyb15.imgur.com/all/",
    "https://bumos1.imgur.com/all/",
    "https://imgur.com/VpvBdnD https://imgur.com/4ZgKabe",
    "https://imgur.com/bLghKx5 ,https://imgur.com/u4r59Qv",
    "https://imgur.com/2",
    "https://imgur.com/WHIm9etR",
    "https://m.imgur.com/skrpenis/HgcjuvQ",
    "https://imgur.com/a/ZbLwFO3 highest square",
    "https://imgur.com/a/pv7ozul also add a section for siege wrs bruh",
    "https://imgur.com/a/8LavP3e | https://youtu.be/l6yOkXAf4NQ",
    "https://imgur.com/a",
    "https://imgur.com/8",
    "https://imgur.com/XD",
    "https://imgur.com/a/jAsFtg5 https://imgur.com/PtqYgJ4 https://imgur.com/2WiLiwh https://imgur.com/Gz6uUU8 https://imgur.com/nPJ86dP",
])

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
                
                # allow imgur.io and imgur.com
                if 'imgur.' in cell and cell not in invalidLinks:
                    # a special case, add the i. to the start
                    # This link is in WR Rules _ Info.csv and so may not be in final output
                    # because that csv is usually ignored
                    if "https://imgur.com/TWfwVPN.png" in cell:
                        cell = "https://i.imgur.com/TWfwVPN.png"
                    # similar case from Oldest Submissions
                    elif "https://imgur.com/rBvFZIe.png" in cell:
                        cell = "https://i.imgur.com/rBvFZIe.png"
                    # cloudinary can't upload this bc no extension so it redirects 
                    # to the album not direct image:
                    elif "https://i.imgur.com/zGVm0AZ" in cell:
                        cell = "https://i.imgur.com/zGVm0AZ.png"

                    # gallery links seem to always be associated with an account
                    # so I think they'll be safe from deletion
                    if "/gallery/" in cell:
                        continue

                    # this is usually multiple imgur links in one cell
                    # this would be a pain to replace anyways
                    # and also I think most of these were rejected and told
                    # to resubmit with only 1 link anyways
                    if "\n" in cell:
                        continue

                    # example:
                    # https://images-ext-1.discordapp.net/external/4ZoqDGJBBnMUJcQ2so0tn63rQfRBZSgiON6-UbJw23s/https/i.imgur.com/m3iuxUAh.jpg
                    if "discord" in cell.lower():
                        continue

                    # the rest of the links from here out should be either
                    # /a/ links or i.imgur.com direct image links
                    # or the other album format without /a/ like https://imgur.com/DmDMweT
                    # detect if any image links dont match those 3 patterns and print them
                    # to alert user
                    if ('/a/' not in cell) and ('i.imgur.com' not in cell):
                        withoutImgur = cell.replace('https', 'http').replace('http://imgur.com/', '')
                        if len(withoutImgur) != 7: # link id at end should be 7 chars
                            print(f"UNUSUAL PATTERN: [{cell}]")


                    imgurLinks.add(cell)

# dump imgurLinks dict into a json file
OUTPUT_JSON_FILE_NAME = "foundImgurLinks.json"
with open(OUTPUT_JSON_FILE_NAME, 'w') as outputFile:
    json.dump(list(imgurLinks), outputFile)

