const axios = require('axios');

function callGeocoder(searchString, searchContext = 'address') {
  const startTime = new Date().getTime();
  const minCandidateScore = 0;
  let geoLocator = 'BC_address_unit'; // BC_address_unit or BC_street_address
  if (searchContext === 'street') geoLocator = 'bc_street_intersection';
  const baseLocator = `http://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/${geoLocator}/GeocodeServer/findAddressCandidates`;
  const geolocatorUrl = `${baseLocator}?Street=&City=&ZIP=`
  + `&Single+Line+Input=${encodeURIComponent(searchString)}&category=`
  + '&outFields=House%2C+PreType%2C+PreDir%2C+StreetName%2C+SufType%2C+SubAddrUnit%2C+City%2C+ZIP'
  + '&maxLocations=&outSR=&searchExtent='
  + '&location=&distance=&magicKey=&f=pjson';

  return axios.get(geolocatorUrl, { timeout: 5000 })
  .then(response => {
    const endTime = new Date().getTime();
    console.log(`Geocoder ${geoLocator} time: ${(endTime - startTime) / 1000} sec`);
    const result = response.data.candidates.filter(c => {
      // console.log(JSON.stringify(c));
      return (c.score >= minCandidateScore);
    });
    return Promise.resolve(result);
  })
  .catch((err) => {
    if (err) {
      console.log(`Got an error in geocoder lookup: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
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
      candidates.forEach((c) => {
        ++total;
        if (total < maxCandidates) {
          result.locNumber.push(c.attributes.House);
          if (c.attributes.PreType === null || c.attributes.PreType === '') {
            result.locName.push(c.attributes.StreetName);
          } else {
            result.locName.push(`${c.attributes.PreType} ${c.attributes.StreetName}`);
          }
          result.locType.push(c.attributes.SufType);
          result.locPrefix.push(c.attributes.PreDir);
          result.locUnit.push(c.attributes.SubAddrUnit);
          result.locZipcode.push(c.attributes.ZIP);
          if (c.attributes.City === null || c.attributes.City === '') {
            result.locCity.push(c.attributes.City);
          } else {
            result.locCity.push(c.attributes.City);
          }
        }
      });
    });
  }
  return result;
}

module.exports = { callGeocoder, mergeGeocoderResults };
