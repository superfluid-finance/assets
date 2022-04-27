const fs = require("fs");
const path = require('path');
const https = require('https');

const directory_path = path.join(__dirname, '../public/tokens');
const coingecko_base_URL = "https://api.coingecko.com/api/v3"

function writeFile(sub_folders, coingeckoPriceMap) {
  sub_folders.forEach(function (folder) {
    const manifestJsonFilePath = path.join(directory_path, '/' + folder + "/manifest.json");
    const manifestJsonFileRawData = fs.readFileSync(manifestJsonFilePath);
    let manifestParsedJsonData = JSON.parse(manifestJsonFileRawData);
    if (manifestParsedJsonData["coingeckoId"] !== null) {
      manifestParsedJsonData["defaultPrice"] = coingeckoPriceMap[manifestParsedJsonData["coingeckoId"]]
      let updatedManifestJsonData = JSON.stringify(manifestParsedJsonData, null, 2);
      // re-write manifest.json
      fs.writeFile(manifestJsonFilePath, updatedManifestJsonData, (err) => {
        if (err) throw err;
      });
    }
  });
}

function readFile(sub_folders, coingeckoPriceMap) {
  sub_folders.forEach(function (folder) {
    const manifestJsonFilePath = path.join(directory_path, '/' + folder + "/manifest.json");
    const manifestJsonFileRawData = fs.readFileSync(manifestJsonFilePath);
    let manifestParsedJsonData = JSON.parse(manifestJsonFileRawData);
    if (manifestParsedJsonData["isSuperToken"] === true && manifestParsedJsonData["coingeckoId"] !== null) {
      coingeckoPriceMap[manifestParsedJsonData["coingeckoId"]] = 0;
    }
  });
}

function modify(directory) {
  // reading token directory
  fs.readdir(directory, function (err, sub_folders) {
    const coingeckoPriceMap = {};
    if (err) {
      return console.log('Directory not found: ' + err);
    }
    // reading manifest.json and updating coingeckoPriceMap
    readFile(sub_folders, coingeckoPriceMap);
    // fetching coingecko prices
    https.request(`${coingecko_base_URL}/coins/markets?vs_currency=USD&ids=${Object.keys(coingeckoPriceMap).join(",")}`, function (res) {
      let data = '';
      res.on("data", (chunk) => {
        data += chunk;
      })
      res.on('end', () => {
        const parsedResponse = JSON.parse(data);
        parsedResponse.map((_priceInfo) => {
          if (_priceInfo)
            coingeckoPriceMap[_priceInfo.id] = _priceInfo.current_price;
        })
        // update coingecko price into manifest.json
        writeFile(sub_folders, coingeckoPriceMap);
      })
    }).end();
  });
}

try {
  modify(directory_path);
} catch (e) {
  console.error("Error occured:", e);
}
