function searchPermit(searchString, context) {
  
  const myQuery = `
  SELECT *
  FROM simplicity.m_v_simplicity_permits
  where cast(permit_number as TEXT) LIKE $1;
  `;

  return context.pool.query(myQuery, [searchString+'%'])
    .then(result => {
      if (result.rows.length === 0) return { type: 'permit', results: [] };
      result.rows.forEach(row => {
        row.score = 0;
        row.type = 'permit';
      });
      return { type: 'permit', results: result.rows };
    })
    .catch((err) => {
      if (err) {
        console.error(`Got an error in searchPermit: ${JSON.stringify(err)}`);
        throw new Error(err);
      }
    });
}

export default searchPermit;