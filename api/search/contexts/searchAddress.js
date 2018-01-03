function searchAddress(searchContext, searchString, geoCodeResponse, context) {
  if (geoCodeResponse.locName.length === 0) {
    return Promise.resolve(
      {
        type: 'address',
        results: [],
      }
    );
  }
  const fquery = 'SELECT A.civicaddress_id, A.address_full, A.address_city, A.address_zipcode, '
  + 'A.address_number, A.address_unit, A.address_street_prefix, A.address_street_name, '
  + 'A.centerline_id, B.full_street_name, B.lzip, B.rzip '
  + 'from amd.get_search_addresses($1, $2, $3, $4, $5, $6, $7) AS A '
  + 'LEFT OUTER JOIN amd.bc_street AS B on A.centerline_id = B.centerline_id ';
  const args = [
    geoCodeResponse.locNumber,
    geoCodeResponse.locName,
    geoCodeResponse.locType,
    geoCodeResponse.locPrefix,
    geoCodeResponse.locUnit,
    geoCodeResponse.locZipcode,
    geoCodeResponse.locCity,
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
      return {
        score: 0,
        type: 'address',
        civic_address_id: row.civicaddress_id,
        address: row.address_full,
        street_name: row.address_street_name,
        street_prefix: row.address_street_prefix,
        street_number: row.address_number,
        unit: row.address_unit,
        city: row.address_city,
        zipcode: row.address_zipcode,
      };
    })
    .filter(row => {
      if (idMap.hasOwnProperty(row.civic_address_id)) return false;
      idMap[row.civic_address_id] = true;
      return true;
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
      console.log(`Got an error in address search: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

module.exports = searchAddress;
