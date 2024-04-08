function searchOwner(searchString, context) {
  
  let query = 'SELECT formatted_owner_name, pinnum '
  + 'FROM internal.bc_property_pinnum_formatted_owner_names WHERE ';

  const substrings = searchString.split(' ');
  substrings.forEach((itm, index) => {
    substrings[index] = '%' + itm + '%';
  });
  const params = substrings.map((itm, index) => {return '$' + (index + 1)});

  substrings.forEach((itm, index) => {
    query += `formatted_owner_name ILIKE ${params[index]} `;
    if (index < substrings.length - 1) {
      query += 'AND ';
    }
  });
  return context.pool.query(query, substrings)
  .then(result => {
    if (result.rows.length === 0) return { type: 'owner', results: [] };
    const nameMap = {};
    result.rows.forEach(itm => {
      if (!nameMap.hasOwnProperty(itm.formatted_owner_name)) {
        nameMap[itm.formatted_owner_name] = {
          score: 0,
          type: 'owner',
          name: itm.formatted_owner_name,
          pinnums: [itm.pinnum],
        };
      } else {
        nameMap[itm.formatted_owner_name].pinnums.push(itm.pinnum);
      }
    });
    const owners = [];
    for (const owner in nameMap) {
      if (nameMap.hasOwnProperty(owner)) {
        owners.push(nameMap[owner]);
      }
    }

    const finalResult = {
      type: 'owner',
      /*
       * This is a temporary filter until a general policy
       * is formulated. Review by August 1, 2019
       */
      results: owners.filter(o => {
        return !o.name.includes('HELPMATE');
      }),
    };
    return finalResult;
  })
  .catch((err) => {
    if (err) {
      console.error(`Got an error in searchOwner: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

export default searchOwner;
