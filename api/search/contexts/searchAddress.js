import geocoder from '../geocoder.js';
const { convertGeocoderResults } = geocoder;

function searchAddress(searchContext, searchString, geoCodeResponseIn, context) {
  const logger = context.logger;
  const geoCodeResponse = convertGeocoderResults(geoCodeResponseIn[0], null);
  if (geoCodeResponse.locName.length === 0) {
    return Promise.resolve(
      {
        type: 'address',
        results: [],
      }
    );
  }
  const fquery = `SELECT A.civicaddress_id, A.address_full, A.address_city, A.address_zipcode,
  A.address_number, A.address_unit, A.address_street_prefix, A.address_street_name, A.address_street_type,
  A.centerline_id, A.jurisdiction_type, A.longitude_wgs, A.latitude_wgs, B.full_street_name, B.lzip, B.rzip
  from simplicity.get_search_addresses($1, $2, $3, $4, $5, $6, $7) AS A
  LEFT OUTER JOIN internal.bc_street AS B on A.centerline_id = B.centerline_id`;
  const args = [
    geoCodeResponse.locNumber,
    geoCodeResponse.locName,
    geoCodeResponse.locType,
    geoCodeResponse.locPrefix,
    geoCodeResponse.locUnit,
    geoCodeResponse.locZipcode,
    geoCodeResponse.locCity.map(c => { return ''; }), // eslint-disable-line no-unused-vars
  ];
  const idMap = {};
  return context.pool.query(fquery, args)
  .then(result => {
    if (searchContext === 'street') {
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
    }
    // Search context is 'address'
    return result.rows.map(row => {
      const prefix = row.address_street_prefix ? row.address_street_prefix : '';
      const street = row.address_street_name ? row.address_street_name : '';
      const type = row.address_street_type ? row.address_street_type : '';
      return {
        score: 0,
        type: 'address',
        civic_address_id: row.civicaddress_id,
        address: row.address_number !== 99999 ? row.address_full : `${prefix} ${street} ${type} - No addressable building`,
        street_name: row.address_street_name,
        street_prefix: row.address_street_prefix,
        street_number: row.address_number,
        unit: row.address_unit,
        city: row.address_city,
        y: row.latitude_wgs,
        x: row.longitude_wgs,
        is_in_city: (row.jurisdiction_type === 'Asheville Corporate Limits'),
        zipcode: row.address_zipcode,
      };
    })
    .filter(row => {
      if (idMap.hasOwnProperty(row.civic_address_id)) return false;
      idMap[row.civic_address_id] = true;
      return true;
    })
    .sort((a1, a2) => {
      return a1.street_number - a2.street_number;
    })
    ;
  })
  .then(clist => {
    const result = {
      type: 'address',
      results: clist,
    };
    return Promise.resolve(result);
  })
  .catch((err) => {
    if (err) {
      logger.error(`Got an error in address search: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

export default searchAddress;
