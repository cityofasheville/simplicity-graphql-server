const proj4 = require("proj4")

function convert_coords(x,y){
  //convert NC State Plane 2264 to Lat/Lon
  const firstProjection = 'PROJCS["NAD83 / North Carolina (ftUS)",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["US survey foot",0.3048006096012192,AUTHORITY["EPSG","9003"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",36.16666666666666],PARAMETER["standard_parallel_2",34.33333333333334],PARAMETER["latitude_of_origin",33.75],PARAMETER["central_meridian",-79],PARAMETER["false_easting",2000000],PARAMETER["false_northing",0],AUTHORITY["EPSG","2264"],AXIS["X",EAST],AXIS["Y",NORTH]]'
  const secondProjection = "WGS84";
  return proj4(firstProjection,secondProjection,[x,y])
}

const resolvers = {
  Query: {
    permit_realtime(obj, args, context) {
      const logger = context.logger;
      const query = `
      SELECT
      A.permit_num, A.permit_group, A.permit_type, A.permit_subtype, A.permit_category, 
      A.permit_description, A.applicant_name, A.applied_date, A.status_current, A.status_date, 
      A.created_by, A.building_value, A.job_value, A.total_project_valuation, A.total_sq_feet, 
      A.fees, A.paid, A.balance, A.invoiced_fee_total, A.civic_address_id, A.address, A.contractor_name,
      A.contractor_license_number, coords.B1_X_COORD as x, coords.B1_Y_COORD as y, A.internal_record_id, 
      B.comment_seq_number, B.comment_date, B.comments
      FROM (
        SELECT p.permit_num,p.permit_group,p.permit_type,p.permit_subtype,p.permit_category,p.applicant_name,p.permit_description,p.applied_date,p.status_current,
        p.status_date,p.technical_contact_name,p.technical_contact_email,p.created_by,p.building_value,p.job_value,p.total_project_valuation,p.total_sq_feet,
        p.fees,p.paid,p.balance,p.invoiced_fee_total,p.civic_address_id,p.site_address,p.city,p.zip,p.pinnum,c.contractor_name,c.contractor_license_number,p.internal_record_id,
        site_address as address
        FROM amd.permits p
        LEFT JOIN amd.permit_contractors c 
        ON p.permit_num = c.permit_num
      ) AS A
      LEFT JOIN amd.permit_comments AS B on A.permit_num = B.permit_num 
      LEFT JOIN (
        select B1_PER_ID1 + '-' + B1_PER_ID2 + '-' +  B1_PER_ID3 AS CapID, B1_X_COORD,B1_Y_COORD,B1_FULL_ADDRESS FROM B3ADDRES
      ) coords
      on A.internal_record_id = coords.CapID
      WHERE A.permit_num = '${args.permit_number}'
      `;

      return context.pool_accela.query(query)
      .then(result => {
        const ret = result.recordset
        // const [lat,lon] = convert_coords(ret[0].x,ret[0].y)
        // ret[0].x = lon
        // ret[0].y = lat
        //console.log(query,result,ret)
        return ret;
      })
      .catch(error => {
        //logger.error(`Error in permit_realtime endpoint: ${JSON.stringify(error)}`);
        throw new Error(error);
      });
    },
  },
};

module.exports = resolvers;
