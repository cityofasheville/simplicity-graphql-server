const axios = require('axios');

function searchPlace(searchString, context) {
  const logger = context.logger;
  const keyword = searchString.replace(/\s/g, '%20');
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyBy-YYl13oQZBLm-v1udn5Thk1JSPuOVR0&location=35.5951,-82.5515&radius=50000&keyword=${keyword}`;
  return axios.get(url, { timeout: 5000 })
  .then(response => {
    return response.data.results.map(place => {
      return {
        score: 0,
        type: 'place',
        name: place.name,
        address: place.vicinity,
        id: place.id,
        place_id: place.place_id,
        types: place.types,
      };
    })
    .filter(p => {
      return (p.address !== 'Asheville' &&
       p.address !== 'United States');
    });
  })
  .then(results => {
    return {
      type: 'place',
      results,
    };
  })
  .catch((err) => {
    if (err) {
      logger.error(`Got an error in geocoder lookup: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

module.exports = searchPlace;
