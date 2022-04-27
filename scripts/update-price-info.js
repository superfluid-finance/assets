const fs = require("fs");
const path = require('path');
const https = require('https');

const directory_path = path.join(__dirname, '../public/tokens');
const coingecko_base_URL = "https://api.coingecko.com/api/v3"
const chunk_size = 10;

function modify(directory) {
  fs.readdir(directory, function (err, sub_folders) {
    const coingeckoPriceMap = {};
    if (err) {
      return console.log('Directory not found: ' + err);
    }
    sub_folders.forEach(function (folder) {
      const manifestJsonFilePath = path.join(directory_path, '/' + folder + "/manifest.json");
      const manifestJsonFileRawData = fs.readFileSync(manifestJsonFilePath);
      let manifestParsedJsonData = JSON.parse(manifestJsonFileRawData);
      if (manifestParsedJsonData["isSuperToken"] === true && manifestParsedJsonData["coingeckoId"] !== null) {
        coingeckoPriceMap[manifestParsedJsonData["coingeckoId"]] = 0;
      }
    });

    https.request(`${coingecko_base_URL}/coins/markets?vs_currency=USD&ids=${Object.keys(coingeckoPriceMap).join(",")}`, function (res) {
      let data = '';
      res.on("data", (chunk) => {
        data += chunk;
      })
      res.on('end', () => {
        const parsedResponse = JSON.parse(data);
        parsedResponse.map((_priceInfo) => {
          coingeckoPriceMap[_priceInfo.id] = _priceInfo.current_price;
        })
        sub_folders.forEach(function (folder) {
          const manifestJsonFilePath = path.join(directory_path, '/' + folder + "/manifest.json");
          const manifestJsonFileRawData = fs.readFileSync(manifestJsonFilePath);
          let manifestParsedJsonData = JSON.parse(manifestJsonFileRawData);
          if (manifestParsedJsonData["coingeckoId"] !== null) {
            manifestParsedJsonData["defaultPrice"] = coingeckoPriceMap[manifestParsedJsonData["coingeckoId"]]
            let updatedManifestJsonData = JSON.stringify(manifestParsedJsonData, null, 2);
            fs.writeFile(manifestJsonFilePath, updatedManifestJsonData, (err) => {
              if (err) throw err;
            });
          }
        });
      })
    }).end();
  });
}

modify(directory_path);
