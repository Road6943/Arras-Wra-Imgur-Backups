# this file exists bc I don't wanna rewrite a bunch of code
import json
from typing import Dict

secrets: Dict[str,str] = {}
with open("DONT_SHARE_SECRETS.json") as secretsFile:
    secrets = json.load(secretsFile)

getClientId = lambda: secrets['ImgurClientId']
getClientSecret = lambda: secrets['ImgurClientSecret']