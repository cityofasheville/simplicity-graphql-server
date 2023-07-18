const { mergeGeocoderResults } = require('../geocoder');

function searchStreet(searchContext, searchString, geoCodeResponseIn, context) {
  const logger = context.logger;
  const geoCodeResponse = mergeGeocoderResults(geoCodeResponseIn);
  if (geoCodeResponse.locName.length === 0) {
    return Promise.resolve(
      {
        type: 'street',
        results: [],
      }
    );
  }

  const nmap = {
    test: {},
    name: [],
    city: [],
    zip: [],
  };
  geoCodeResponse.locName.forEach((name, index) => {
    const zip = geoCodeResponse.locZipcode[index];
    const city = geoCodeResponse.locCity[index];
    const test = `${name}-${zip}-${city}`;
    if (!nmap.test.hasOwnProperty(test) ) { // && zip !== null && zip !== '') {
      nmap.test[test] = true;
      nmap.name.push(name);
      nmap.city.push(city);
      nmap.zip.push(zip);
    }
  });
  const fquery = 'SELECT centerline_id, full_street_name, left_zipcode, right_zipcode '
  + 'from simplicity.get_search_streets2($1, $2) ';
  const args = [
    nmap.name,
    nmap.zip,
  ];
  const idMap = {};
  return context.pool.query(fquery, args)
  .then(result => {
    const r = [];
    result.rows.forEach(row => {
      let idx = `${row.full_street_name}.${row.lzip}`;
      if (!idMap.hasOwnProperty(idx)) {
        idMap[idx] = {
          score: 0,
          type: 'street',
          full_street_name: row.full_street_name,
          zip_code: row.lzip,
          centerline_ids: {},
        };
        idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
      } else {
        idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
      }
      if (row.lzip !== row.rzip) {
        idx = `${row.full_street_name}.${row.rzip}`;
        if (!idMap.hasOwnProperty(idx)) {
          idMap[idx] = {
            score: 0,
            type: 'street',
            full_street_name: row.full_street_name,
            zip_code: row.rzip,
            centerline_ids: {},
          };
          idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
        } else {
          idMap[idx].centerline_ids[row.centerline_id] = row.centerline_id;
        }
      }
    });
    for (const k in idMap) {
      if (idMap.hasOwnProperty(k)) {
        idMap[k].centerline_ids = Object.keys(idMap[k].centerline_ids);
        r.push(idMap[k]);
      }
    }
    return r;
  })
  .then(clist => {
    const result = {
      type: 'street',
      results: clist,
    };
    return Promise.resolve(result);
  })
  .catch((err) => {
    if (err) {
      logger.error(`Got an error in street search: ${JSON.stringify(err)}`);
      throw err;
    }
  });
}

module.exports = searchStreet;
