function searchOwner(searchString, context) {
  let query = 'SELECT formatted_owner_name, pinnum '
  + 'FROM amd.bc_property_pinnum_formatted_owner_names WHERE ';

  const substrings = searchString.split(' ');
  substrings.forEach((itm, index) => {
    query += `formatted_owner_name ILIKE '%${itm}%' `;
    if (index < substrings.length - 1) query += 'AND ';
  });
  return context.pool.query(query)
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
      results: owners,
    };
    return finalResult;
  })
  .catch((err) => {
    if (err) {
      console.log(`Got an error in searchOwner: ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  });
}

module.exports = searchOwner;
