import requests, json, os
from imgurpython import ImgurClient
from acquireSecrets import getClientId, getClientSecret
from typing import Tuple, Dict, List, Set
from collections import defaultdict
import jsonlines


# /gallery links can be json-ed without the api - make sure the account isn't "" or None
#res = requests.get('https://imgur.com/gallery/GCZdO.json').text
#print(res)

# jsonlines file https://jsonlines.readthedocs.io/en/latest/
outputFilename = "hashmapOfImgurLinkToItsDirectImageLinks.jsonl"

# run this on its own by commenting stuff on/off in main
def findLinksThatDontMatchAPattern():
    print("\nLINKS THAT DONT MATCH A PATTERN:\n")

    # find links that don't match a known pattern
    with open("foundImgurLinks.json") as jsonFile:
        imgurLinks = json.load(jsonFile)
        
        counts = {
            "/a/": 0,
            "i.imgur": 0,

            # we shouldn't see these anymore, as I'm filtering 
            # them out bc they seem to always have an account 
            # associated with them so won't be deleted
            "/gallery/": 0,
        }
        totalLinks = 0


        for link in imgurLinks:
            totalLinks += 1
            anyKeyInLink = False

            for key in counts:
                if key in link:
                    counts[key] += 1
                    anyKeyInLink = True

            # these follow this format:
            # https://imgur.com/cUDPp3d
            if not anyKeyInLink:
                print(link)
        
        print()
        for pattern in counts:
            print(f"{pattern} => {counts[pattern]}")
        print(f"total links => {totalLinks}\n")


# this file may be run multiple times to retry failed api requests,
# so save previous attempts in the same file we will append to
# and thereby avoid remaking api requests unneccesarily
def parseExistingLinksToDirectLinksFile() -> Set[str]:
    if not os.path.isfile(outputFilename):
        return set()
        
    seenLinks = set()
    with jsonlines.open(outputFilename) as reader:
        for obj in reader: # obj looks like { "imgurLink": ["allDirectImageLinksInAlbumOrDirectLinkToSingleImage"] }
            for imgurLink in obj:
                seenLinks.add(imgurLink)
                print(f"Added {imgurLink} to seenLinks")

    return seenLinks



# returns tuple of (id, type='album' or 'image')
def extractImgurIdAndType(link: str) -> Tuple[str, str]:
    link = link.strip()

    # album link
    if '/a/' in link:
        return (link[-7:], 'album') # get last 7 chars
    elif 'i.imgur.com' in link:
        # remove file extension
        link = link.split('.')[-2]
        return (link[-7:], 'image')
    else:
        # basically just stuff like https://imgur.com/gmgDjlC
        # I will treat these as images since they work with api get_image but not get_album
        # but I say other so that I can extract direct link with api
        return (link[-7:], 'other')
    

# build a giant dict where imgur direct image links point to a 1 item array containing themselves
# and imgur album links point to an array containing all of that album's direct image links
def buildDictOfImgurLinksToAllTheirDirectLinks() -> Dict[str, List[str]]:
    imgurLinks = []
    with open("foundImgurLinks.json") as jsonFile:
        imgurLinks: list[str] = json.load(jsonFile)

    #imgurLinks = imgurLinks[:1100] # TODO REMOVE for testing only

    client = ImgurClient(getClientId(), getClientSecret())
    totalFailed = 0
    failedLinks = []
    imageSizesSample = []

    # load all previously seen imgur Links to avoid repeating ourself
    seenLinks: Set[str] = parseExistingLinksToDirectLinksFile()

    # copy and paste the failed links into here if they're 404 errors (deleted)
    known404Links = '''
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
    '''
    known404Links = set([ link.strip() for link in known404Links.split('\n') ])
    #print(known404Links)

    with jsonlines.open(outputFilename, mode='a') as writer: # append only
        for i,link in enumerate(imgurLinks):
            # skip links we already have data for / are deleted
            if link in seenLinks or link in known404Links:
                continue

            try:
                id, type = extractImgurIdAndType(link)
                linkDict = {} # { mainlink: [all direct image links for main link] }
                
                if type == 'album':
                    assert len(id) == 7
                    res = client.get_album(id)

                    # account_url is None if no account
                    account = res.account_url
                    # don't save images tied to an account bc they won't be deleted
                    if account is not None:
                        linkDict[link] = []
                    # if no account, then save all images
                    else:
                        imageLinksInAlbum = [img['link'] for img in res.images]
                        linkDict[link] = imageLinksInAlbum
                
                elif type == 'image':
                    # you cant get the account of an image thru api
                    # make link point to 1 item list of itself
                    linkDict[link] = [ link ]

                elif type == 'other':
                    # these are images, but use api to extract direct link
                    res = client.get_image(id)
                    directLink = res.link
                    linkDict[link] = [ directLink ]

                    # print image size in megabytes cause i wanna know and make sure im under
                    # cloudinary's 10mb limit
                    imageSizesSample.append(res.size) # size in bytes
                
                writer.write(linkDict) # write to jsonl file, it seems to print them every 50 iterations
                seenLinks.add(link)
                # show progress
                # empty [] array means theres an account attached
                print(f"link #{i}) {link} => {linkDict[link]}")

                    
            except:
                # often because the link's deleted
                print(f'LINK FAILED: {link}')
                totalFailed += 1
                failedLinks.append(link)
        
    print(f"\nTOTAL FAILED = {totalFailed}:\n -- Failed Links Below:")
    for failedLink in failedLinks:
        print(failedLink)
    
    if len(imageSizesSample) != 0:
        avgSizeInBytes = sum(imageSizesSample) / len(imageSizesSample)
        print(f"\nAverage Image Size in MB = {avgSizeInBytes / 1e6}")

        

    
    
    

def main():
    # findLinksThatDontMatchAPattern()
    buildDictOfImgurLinksToAllTheirDirectLinks()


main()