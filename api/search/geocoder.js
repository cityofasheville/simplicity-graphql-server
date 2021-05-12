const axios = require('axios');

function callGeocoder(searchString, searchContext = 'address', logger) {
  const startTime = new Date().getTime();
  const minCandidateScore = 0;
  let geoLocator = 'BC_address_unit'; // BC_address_unit or BC_street_address
  if (searchContext === 'street') geoLocator = 'bc_street_intersection';
  const baseLocator = `https://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/${geoLocator}/GeocodeServer/findAddressCandidates`;
  const geolocatorUrl = `${baseLocator}?Street=&City=&ZIP=`
  + `&Single+Line+Input=${encodeURIComponent(searchString)}&category=`
  + '&outFields=AddNum%2C+StPreType%2C+StPreDir%2C+StName%2C+StType%2C+SubAddUnit%2C+City%2C+ZIP'
  + '&maxLocations=&outSR=&searchExtent='
  + '&location=&distance=&magicKey=&f=pjson';

  return axios.get(geolocatorUrl, { timeout: 5000 })
  .then(response => {
    const totalTime = (new Date().getTime() - startTime) / 1000.0;
    if (totalTime > 4) {
      logger.warn(`Geocoder ${geoLocator} time: ${totalTime} sec`);
    }
    const result = response.data.candidates.filter(c => {
      return (c.score >= minCandidateScore);
    });
    return Promise.resolve(result);
  })
  .catch((err) => {
    if (err) {
      logger.error(`Got an error in geocoder lookup: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

function processCandidate(c, result) {
  result.locNumber.push(c.attributes.AddNum);
  if (c.attributes.StPreType === null || c.attributes.StPreType === '') {
    result.locName.push(c.attributes.StName);
  } else {
    result.locName.push(`${c.attributes.StPreType} ${c.attributes.StName}`);
  }
  result.locType.push(c.attributes.StType);
  result.locPrefix.push(c.attributes.StPreDir);
  result.locUnit.push(c.attributes.SubAddUnit);
  result.locZipcode.push(c.attributes.ZIP);
  if (c.attributes.City === null || c.attributes.City === '') {
    result.locCity.push(c.attributes.City);
  } else {
    result.locCity.push(c.attributes.City);
  }
}

function mergeGeocoderResults(candidateSet) {
  const maxCandidates = 500;
  const result = {
    locNumber: [],
    locName: [],
    locType: [],
    locPrefix: [],
    locUnit: [],
    locZipcode: [],
    locCity: [],
  };
  if (candidateSet.length > 0 && candidateSet[0] !== null) {
    let total = 0;
    candidateSet.forEach((candidates) => {
      if (candidates) {
        candidates.forEach((c) => {
          ++total;
          if (total < maxCandidates) {
            processCandidate(c, result);
          }
        });
      }
    });
  }
  return result;
}

function convertGeocoderResults(candidates1, candidates2) {
  const maxCandidates = 500;
  const result = {
    locNumber: [],
    locName: [],
    locType: [],
    locPrefix: [],
    locUnit: [],
    locZipcode: [],
    locCity: [],
  };
  const candidateSet = [candidates1, candidates2];
  if (candidateSet.length > 0 && candidateSet[0] !== null) {
    let total = 0;
    candidateSet.forEach((candidates) => {
      if (candidates) {
        candidates.forEach((c) => {
          ++total;
          if (total < maxCandidates) {
            processCandidate(c, result);
          }
        });
      }
    });
  }
  return result;
}

module.exports = { callGeocoder, mergeGeocoderResults, convertGeocoderResults };
