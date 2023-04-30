import jsonlines, json
from typing import Dict
from collections import defaultdict
from acquireSecrets import getGithubPagesSiteBaseURL
from requests.models import PreparedRequest


newLinksFileName = "newLinks.jsonl"
hashmapFileName = "hashmapOfImgurLinkToItsDirectImageLinks.jsonl"

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


def makeSwappingDict(inputData):
    swaps: Dict[str,str] = {}
    baseUrl = getGithubPagesSiteBaseURL()

    for oldParentLink in inputData:
        childLinks = inputData[oldParentLink]["childLinks"]

        # if there's only 1 image in album
        # or if it was a direct image link before
        # then its swap will be a cloudinary direct image link
        if len(childLinks) == 1:
            swaps[oldParentLink] = childLinks[0]
            continue

        # for all other links with multiple images in album
        # I built a github pages site that somewhat replicates
        # imgur's album view using the Cloudinary Product Gallery widget
        # so construct a link to that and use that as the swap link
        # we already made sure that there's only 1 tag for every oldParentLink earlier
        tag = inputData[oldParentLink]["tags"].pop()

        # construct the link using requests - https://stackoverflow.com/a/49957974
        req = PreparedRequest()
        req.prepare_url(baseUrl, { "imgurLinkBase64": tag })
        print(req.url)
        swaps[oldParentLink] = req.url

    return swaps
        



def main():
    inputData, allOldImgurLinksUploadedToCloudinary = readNewLinksFile()
    makeSureAllParentLinksHaveOnly1Tag(inputData)
    makeSureNoLinksWereMissedWhenUploading(allOldImgurLinksUploadedToCloudinary)
    swapsDict = makeSwappingDict(inputData)

main()