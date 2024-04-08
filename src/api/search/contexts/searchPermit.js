function searchPermit(searchString, context) {
  
  const myQuery = `
  SELECT DISTINCT permit_num, permit_group, permit_type, permit_subtype, 
  permit_category, permit_description, applicant_name, applied_date, 
  status_current, status_date, civic_address_id, address,
  latitude, longitude, internal_record_id
  FROM simplicity.permits_xy_view
  where cast(permit_num as TEXT) LIKE $1;
  `;

  return context.pool.query(myQuery, [searchString+'%'])
    .then(result => {
      if (result.rows.length === 0) return { type: 'permit', results: [] };

      const finalResult = {
        type: 'permit',
        results: result.rows.map(row => {
          return {
            score: 0,
            type: 'permit',
            permit_number: row.permit_num,
            permit_group: row.permit_group,
            permit_type: row.permit_type,
            permit_subtype: row.permit_subtype,
            permit_category: row.permit_category,
            permit_description: row.permit_description,
            applicant_name: row.applicant_name,
            application_name: row.applicant_name,
            applied_date: row.applied_date,
            status_current: row.status_current,
            status_date: row.status_date,
            civic_address_id: row.civic_address_id,
            address: row.address,
            x: row.longitude,
            y: row.latitude,
            internal_record_id: row.internal_record_id,          };
        }),
      };
      return finalResult;
    })
    .catch((err) => {
      if (err) {
        console.error(`Got an error in searchPermit: ${JSON.stringify(err)}`);
        throw new Error(err);
      }
    });
}

export default searchPermit;
