const axios = require('axios');

let xyCache = null;
let cacheDate = null;

function prepareProjects(rows) {
  if (rows.length === 0) return [];
  return rows.map(itm => {
    let latitude = [];
    let longitude = [];
    if (xyCache.hasOwnProperty(itm.project)) {
      latitude = xyCache[itm.project].latitude;
      longitude = xyCache[itm.project].longitude;
    }
    return {
      gis_id: itm.gis_id,
      munis_project_number: itm.munis_project_number,
      project: itm.project,
      display_name: itm.display_name,
      location_details: itm.location_details,
      zip_code: itm.zip_code,
      type: itm.type,
      category: itm.category,
      category_number: itm.display_order,
      coa_contact: itm.coa_contact,
      phone_number: itm.phone_number,
      email_address: itm.email_address,
      owner_department: itm.owner_department,
      administering_department: itm.administering_department,
      project_description: itm.project_description,
      status: itm.status,
      total_project_funding_budget_document: itm.total_project_funding__budget_document_,
      total_spent: itm.ltd_actuals ? itm.ltd_actuals : 0,
      encumbered: itm.encumbrances ? itm.encumbrances : 0,
      target_construction_start: itm.target_construction_start,
      target_construction_end: itm.target_construction_end,
      actual_construction_end: itm.actual_construction_end,
      amount_behind_schedule: itm.amount_behind_schedule,
      estimated_construction_duration: itm.estimated_construction_duration,
      project_folder: itm.project_folder,
      project_webpage_more_information: itm.project_webpage__more_information_,
      communication_plan: itm.communication_plan,
      photo_url: itm.photo_url,
      project_updates: itm.project_updates,
      latitude,
      longitude,
    };
  });
}

const resolvers = {
  Query: {
    cip_project_categories(obj, args, context) {
      const pool = context.pool;
      const query = 'select C.category_name, C.display_order, '
      + 'COUNT(M.objectid) AS total_count, '
      + "SUM(CASE WHEN M.type = 'Bond' THEN 1 ELSE 0 END) AS bond_count "
      + 'from internal.capital_projects_master_categories C left outer join '
      + 'internal.capital_projects_master M on M.category = C.category_name '
      + 'group by C.category_name, C.display_order';
      return pool.query(query)
      .then(result => {
        return result.rows.map(itm => {
          return {
            category_name: itm.category_name,
            category_number: itm.display_order,
            total_count: itm.total_count,
            bond_count: itm.bond_count,
          };
        });
      });
    },
    // Note: query can EITHER specify names OR it can specify
    // one or both of categories & zipcodes
    cip_projects(obj, args, context) {
      const logger = context.logger;
      const pool = context.pool;
      let query = 'select A.*, B.*, C.display_order from internal.capital_projects_master as A '
      + 'left join internal.capital_projects_master_categories as C '
      + 'on A.category = C.category_name '
      + 'left join simplicity.cip_ltd_view as B '
      + 'on A.munis_project_number = B.project_id ';
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
      query += ' ORDER BY A.display_name';
      console.log(query);

      return pool.query(query)
      .then(result => {
        const timeout = 1000 * 3600;
        if (cacheDate === null || (new Date()).getTime() - cacheDate.getTime() > timeout) {
          console.log('Updating CIP project XY cache');
          const fsUrl = 'https://services.arcgis.com/aJ16ENn1AaqdFlqx/ArcGIS/rest/services/CIP_Storymap/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=true&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnDistinctValues=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=';
          return axios.get(fsUrl, { timeout: 5000 })
          .then(xyResult => {
            xyCache = {};
            xyResult.data.features.forEach(feature => {
              const f = feature.attributes;
              const fname = f.NAME.replace(/^\s+|\s+$/g, '');
              if (!xyCache.hasOwnProperty(fname)) {
                xyCache[fname] = {
                  name: fname,
                  tab_name: f.TAB_NAME,
                  short_desc: f.SHORT_DESC,
                  website: f.WEBSITE,
                  pic_url: f.PIC_URL,
                  thumb_url: f.THUMB_URL,
                  longitude: [],
                  latitude: [],
                };
              }
              xyCache[fname].longitude.push(f.LONG);
              xyCache[fname].latitude.push(f.LAT);
            });
            cacheDate = new Date();
            return result;
          });
        }
        return Promise.resolve(result);
      })
      .then(result => {
        return prepareProjects(result.rows);
      })
      .catch(error => {
        logger.error(`Error in cip_projects endpoint: ${error}`);
        throw new Error(error);
      });
    },
  },
};

module.exports = resolvers;
