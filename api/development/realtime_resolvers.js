const proj4 = require("proj4")

function convert_coords(x,y){
  //convert NC State Plane 2264 to Lat/Lon
  if (typeof(x) != 'number' ||typeof(y) != 'number'){return [null,null]}
  const firstProjection = 'PROJCS["NAD83 / North Carolina (ftUS)",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["US survey foot",0.3048006096012192,AUTHORITY["EPSG","9003"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",36.16666666666666],PARAMETER["standard_parallel_2",34.33333333333334],PARAMETER["latitude_of_origin",33.75],PARAMETER["central_meridian",-79],PARAMETER["false_easting",2000000],PARAMETER["false_northing",0],AUTHORITY["EPSG","2264"],AXIS["X",EAST],AXIS["Y",NORTH]]'
  const secondProjection = "WGS84";
  return proj4(firstProjection,secondProjection,[x,y])
}

function get_xy(obj, args, context) {
  return new Promise((resolve,reject) => {
    const query = `select top 1 B1_X_COORD AS x, B1_Y_COORD AS y FROM B3ADDRES
    where B1_PER_ID1 + '-' + B1_PER_ID2 + '-' +  B1_PER_ID3 = '${obj.internal_record_id}'
    order by B1_PRIMARY_ADDR_FLG desc, B1_ADDRESS_NBR desc `
    context.pool_accela.query(query)
    .then((result) => {
      let [cx,cy] = convert_coords(result.recordset[0].x, result.recordset[0].y);
      resolve ([cx,cy]);
    })
    .catch((err) => {
      console.log(err);
      reject (new Error(`Got an error in PermitRT.xy: ${err}`));
    });
  });
}

const stdQuery = `
SELECT DISTINCT
A.permit_num permit_number, A.permit_group, A.permit_type, A.permit_subtype, A.permit_category, 
A.permit_description, A.applicant_name, CONVERT(VARCHAR(19),A.applied_date,126) + 'Z' AS applied_date, A.status_current, 
CONVERT(VARCHAR(19),A.status_date,126) + 'Z' AS status_date, A.technical_contact_name, A.technical_contact_email,
A.created_by, A.building_value, CAST(A.job_value AS VARCHAR) AS job_value, A.total_project_valuation, A.total_sq_feet, 
A.fees, A.paid, A.balance, A.invoiced_fee_total, A.civic_address_id, A.site_address AS address, A.internal_record_id
FROM amd.permits A
WHERE A.permit_num not like '%TMP%' 
`
const resolvers = {
  Query: {
    permit_realtime(obj, args, context) {
      const logger = context.logger;
      const query = `${stdQuery}
      AND A.permit_num = '${args.permit_number}'
      ORDER BY status_date DESC
      `;

      return context.pool_accela.query(query)
      .then(result => {
        if(!result.recordset[0]){ return undefined}
        const ret = result.recordset[0]
        ret.application_name = ret.applicant_name
        const [lon,lat] = convert_coords(ret.x,ret.y)
        ret.x = lon
        ret.y = lat
        // console.log(query,result,ret)
        // console.log(ret)

        return ret;
      })
      .catch(error => {
        //logger.error(`Error in permit_realtime endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
    permits_by_address_realtime(obj, args, context) {
      const logger = context.logger;
      const query = `${stdQuery}
      AND A.civic_address_id = '${args.civicaddress_id}'
      ORDER BY status_date DESC
      `;

      return context.pool_accela.query(query)
      .then(result => {
        if(!result.recordset[0]){ return undefined}
        const ret = result.recordset
        ret.forEach(r=>{
          r.application_name = r.applicant_name
          const [lon,lat] = convert_coords(r.x,r.y)
          r.x = lon
          r.y = lat
          return r
        })
        // console.log(query,result,ret)
        // console.log(ret)

        return ret;
      })
      .catch(error => {
        //logger.error(`Error in permit_realtime endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
  PermitRT: {
    async x(obj, args, context) {
      const result = await get_xy(obj, args, context);
      return result[0];
    },
    async y(obj, args, context) {
      const result = await get_xy(obj, args, context);
      return result[1];
    },
    contractor_names(obj, args, context) {
      const query = `SELECT c.contractor_name
      FROM amd.permit_contractors c 
      WHERE c.permit_num = '${obj.permit_number}'`;
      return context.pool_accela.query(query)
      .then((result) => {
        return result.recordset.map(obj=>obj.contractor_name);
      })
      .catch((err) => {
        console.log(err);
        throw new Error(`Got an error in PermitRT.contractor_names: ${err}`);
      });
    },
    contractor_license_numbers(obj, args, context) {
      const query = `SELECT c.contractor_license_number
      FROM amd.permit_contractors c 
      WHERE c.permit_num = '${obj.permit_number}'`;
      return context.pool_accela.query(query)
      .then((result) => {
        return result.recordset.map(obj=>obj.contractor_license_number);
      })
      .catch((err) => {
        console.log(err);
        throw new Error(`Got an error in PermitRT.contractor_license_numbers: ${err}`);
      });
    },
    comments(obj, args, context) { // eslint-disable-line no-unused-vars
      const query = `SELECT B.comment_seq_number, B.comment_date, B.comments
      FROM amd.permit_comments B
      WHERE B.permit_num = '${obj.permit_number}'`;
      return context.pool_accela.query(query)
      .then((result) => {
        return result.recordset;
      })
      .catch((err) => {
        console.log(err);
        throw new Error(`Got an error in PermitRT.comments: ${err}`);
      });
    },
    custom_fields(obj, args, context) {
      const query = `select type, name, value from amd.permit_custom_fields 
      where permit_num = '${obj.permit_number}'`;
      return context.pool_accela.query(query)
      .then((result) => {
        return result.recordset;
      })
      .catch((err) => {
        console.log(err);
        throw new Error(`Got an error in PermitRT.custom_fields: ${err}`);
      });
    },
  },
};

module.exports = resolvers;
