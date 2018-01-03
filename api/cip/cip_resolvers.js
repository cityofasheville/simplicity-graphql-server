const hidePMFields = {
  'Affordable Housing Investments': true,
  'Velodrome Resurfacing': true,
  'New Leicester Hwy Sidewalks': true,
  'Swannanoa River Greenway Phase 1': true,
  'Coxe Ave - Feasibility & Design': true,
  'Eagle Market Place': true,
  'I - 26 Connector': true,
  'Lee Walker Heights Redevelopment': true,
};

function prepareProjects(rows) {
  if (rows.length === 0) return [];
  return rows.map(itm => {
    return {
      gis_id: itm.gis_id,
      munis_project_number: itm.munis_project_number,
      project: itm.project,
      display_name: itm.display_name,
      location_details: itm.location_details,
      zip_code: itm.zip_code,
      category: itm.category,
      coa_contact: itm.coa_contact,
      phone_number: itm.phone_number,
      email_address: itm.email_address,
      owner_department: itm.owner_department,
      administering_department: itm.administering_department,
      project_description: itm.project_description,
      status: itm.status,
      go_bond_funding: itm.go_bond_funding,
      cip_funding_total: itm.cip_funding__total_,
      grant_funding_total: itm.grant_funding__total_,
      other_funding: itm.other_funding,
      total_project_funding_budget_document: itm.total_project_funding__budget_document_,
      preliminary_project_budget_planning_phase_estimate: itm.preliminary_project_budget__planning_phase_estimate_,
      estimated_total_project_cost: itm.estimated_total_project_cost,
      total_spent: itm.ltd_actuals ? itm.ltd_actuals : 0,
      target_construction_start: itm.target_construction_start,
      target_construction_end: itm.target_construction_end,
      actual_construction_end: itm.actual_construction_end,
      amount_behind_schedule: itm.amount_behind_schedule,
      estimated_construction_duration: itm.estimated_construction_duration,
      project_folder: itm.project_folder,
      project_webpage_more_information: itm.project_webpage__more_information_,
      communication_plan: itm.communication_plan,
      photo_url: itm.photo_url,
      map_tab: itm.map_tab,
      project_updates: itm.project_updates,
      where: itm.where_,
      contact: itm.contact,
      show_pm_fields: !hidePMFields.hasOwnProperty(itm.project),
    };
  });
}

const resolvers = {
  Query: {
    // Note: query can EITHER specify names OR it can specify
    // one or both of categories & zipcodes
    cip_projects(obj, args, context) {
      const pool = context.pool;
      let query = 'select * from amd.coa_cip_project_information as A '
      + 'left join amd.project_ltd_actuals as B '
      + 'on A.munis_project_number = B.projectid ';
      // let query = 'SELECT * FROM amd.coa_cip_project_information ';
      const names = args.names;
      if (names && names.length > 0) {
        if (names.length <= 0) return [];
        const namesList = names.map(p => {
          return `'${p}'`;
        }).join(',');
        query += `WHERE project in (${namesList})`;
      } else {
        const categories = args.categories;
        const zipcodes = args.zipcodes;
        let haveWhere = false;
        if (categories && categories.length > 0) {
          const cList = categories.map(p => {
            return `'${p}'`;
          }).join(',');
          query += `WHERE category in (${cList})`;
          haveWhere = true;
        }
        if (zipcodes && zipcodes.length > 0) {
          const zList = zipcodes.map(p => {
            return `'${p}'`;
          }).join(',');
          if (haveWhere) {
            query += 'AND ';
          } else {
            query += 'WHERE ';
          }
          query += `zip_code in (${zList})`;
        }
      }
      console.log(query);
      return pool.query(query)
      .then(result => {
        return prepareProjects(result.rows);
      })
      .catch(error => {
        console.log(`Error in cip_projects endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
};

module.exports = resolvers;
