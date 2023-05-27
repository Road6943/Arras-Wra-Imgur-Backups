import jsonlines, json
from typing import Dict
from collections import defaultdict
from acquireSecrets import getGithubPagesSiteBaseURL, getCloudinaryCloudName
from requests.models import PreparedRequest


newLinksFileName = "newLinks.jsonl"
hashmapFileName = "hashmapOfImgurLinkToItsDirectImageLinks.jsonl"
replacementsFileName = "replacements.json"
urlsThatDontNeedReplacingFileName = "urlsThatDontNeedReplacing.json"

# build up a dict where each parent link points to an array
# holding all its child links
# basically the same structure as the hashmap file but with the old direct image links
# replaced with the newer cloudinary links
def readNewLinksFile():
    inputData = {}
    allOldImgurLinksThatGotUploadedToCloudinary: set[str] = set()

    # each line of input file looks like this:
    # { oldParentLink:"", oldImgurLink:"", newLink:"", tag:"" }
    with jsonlines.open(newLinksFileName) as reader:
        for obj in reader:
            oldParentLink = obj["oldParentLink"]

            if oldParentLink not in inputData:
                inputData[oldParentLink] = {
                    "childLinks": [],
                    "tags": set(),
                }
            
            inputData[oldParentLink]["childLinks"].append( obj["newLink"] )
            inputData[oldParentLink]["tags"].add( obj["tag"] )

            # add both direct link and its parent to account for duplicate direct
            # image links such as one in an album and one on its own
            allOldImgurLinksThatGotUploadedToCloudinary.add(
                obj["oldImgurLink"] + obj["oldParentLink"]
            )
    
    return (inputData, allOldImgurLinksThatGotUploadedToCloudinary)


def makeSureAllParentLinksHaveOnly1Tag(inputData):
     # make sure there's only 1 tag per oldParentLink
    allParentsHaveOnly1Tag = True

    for oldParentLink in inputData:
        tags = inputData[oldParentLink]["tags"]
        if len(tags) != 1:
            allParentsHaveOnly1Tag = False
            print("ERROR MULTIPLE TAGS: " + oldParentLink)
            for tag in tags:
                print("-> " + tag)

    if allParentsHaveOnly1Tag:
        print("GOOD, All Parent Links Have Only 1 Tag")
    else:
        print("BAD, Some parent links have multiple tags!!!")


# grab all direct image links in the hashmap file and make sure they were all
# uploaded to cloudinary
def makeSureNoLinksWereMissedWhenUploading(allOldImgurLinksUploadedToCloudinary: set[str]):
    allLinksWereUploaded = True
    
    with jsonlines.open(hashmapFileName) as reader:
        for obj in reader:
            for parentLink in obj:
                childLinks = obj[parentLink]
                for childLink in childLinks:
                    if (childLink+parentLink) not in allOldImgurLinksUploadedToCloudinary:
                        print("LINK NOT UPLOADED! -> " + childLink)
                        allLinksWereUploaded = False
    
    if allLinksWereUploaded:
        print("GOOD: every old imgur direct link has been uploaded to Cloudinary")
    else:
        print("BAD: SOME OLD IMGUR DIRECT IMAGES WERE NOT UPLOADED TO CLOUDINARY")


def makeReplacementsDicts(inputData):
    replacements: Dict[str,str] = {}
    baseUrl = getGithubPagesSiteBaseURL()

    for oldParentLink in inputData:
        childLinks = inputData[oldParentLink]["childLinks"]

        # if there's only 1 image in album
        # or if it was a direct image link before
        # then its replacement will be a cloudinary direct image link
        if len(childLinks) == 1:
            #replacements[oldParentLink] = childLinks[0]
            #continue
            # just use the road-github format for everything so its
            # easier to change image hosts later
            pass

        # for all other links with multiple images in album
        # I built a github pages site that somewhat replicates
        # imgur's album view using the Cloudinary Product Gallery widget
        # so construct a link to that and use that as the replacement link
        # we already made sure that there's only 1 tag for every oldParentLink earlier
        tag = inputData[oldParentLink]["tags"].pop()

        # construct the link using requests - https://stackoverflow.com/a/49957974
        req = PreparedRequest()

        # I will switch to using the oldLink's directly instead of base64 
        # to make them more readable, I'm using str instead of dict bc
        # I don't want the resulting links to be percent-encoded
        #req.prepare_url(baseUrl, { "imgurLinkBase64": tag })
        req.prepare_url(baseUrl, f"cloudName={getCloudinaryCloudName()}&imgurLink={oldParentLink}")

        replacements[oldParentLink] = req.url

    
    # there's certain links that were modified case-by-case in extractImgurLinks.py
    # make sure to re-add the original link here bc otherwise it won't be replaced
    # nice link on left, weird original on right
    niceFormatLinksToTheirWeirdFormatOriginals = {
        "https://i.imgur.com/TWfwVPN.png": "https://imgur.com/TWfwVPN.png",
    }

    for niceLink, weirdOriginal in niceFormatLinksToTheirWeirdFormatOriginals.items():
        if niceLink in replacements:
            replacements[weirdOriginal] = replacements[niceLink]


    return replacements

        
def makeUrlsThatDontNeedReplacingList():
    urlsThatDontNeedReplacing: list[str] = []
    
    with jsonlines.open(hashmapFileName) as reader:
        for obj in reader:
            for parentLink in obj:
                childLinks = obj[parentLink]
                
                if (len(childLinks) == 0):
                    urlsThatDontNeedReplacing.append(parentLink)
    
    return urlsThatDontNeedReplacing



def main():
    inputData, allOldImgurLinksUploadedToCloudinary = readNewLinksFile()
    makeSureAllParentLinksHaveOnly1Tag(inputData)
    makeSureNoLinksWereMissedWhenUploading(allOldImgurLinksUploadedToCloudinary)
    replacementsDict = makeReplacementsDicts(inputData)
    urlsThatDontNeedReplacing = makeUrlsThatDontNeedReplacingList()

    # print json to file
    with open(replacementsFileName, "w") as replaceFile:
        json.dump(replacementsDict, replaceFile)

    with open(urlsThatDontNeedReplacingFileName, "w") as dontNeedReplacingFile:
        json.dump(urlsThatDontNeedReplacing, dontNeedReplacingFile)


main()