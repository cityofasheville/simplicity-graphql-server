-- FUNCTION: simplicity.get_properties_along_streets(numeric[], numeric)

-- DROP FUNCTION simplicity.get_properties_along_streets(numeric[], numeric);

CREATE OR REPLACE FUNCTION simplicity.get_properties_along_streets(
	cid numeric[],
	ldist numeric)
    RETURNS SETOF simplicity.v_simplicity_properties 
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
    ROWS 1000
AS $BODY$

DECLARE
    r simplicity.v_simplicity_properties%rowtype;
BEGIN
	for i in 1..array_length(cid,1) loop
    	FOR r IN
    		SELECT A.pin,
                    A.pinext,
                    A.pinnum,
                    A.address,
                    A.exempt,
                    A.acreage,
                    A.owner,
                    A.cityname,
                    A.zipcode,
                    A.totalmarketvalue,
                    A.appraisedvalue,
                    A.taxvalue,
                    A.landvalue,
                    A.buildingvalue,
                    A.propcard,
                    A.deedurl,
                    A.platurl,
                    A.appraisalarea,
                    A.neighborhoodcode,
                    A.shape,
                    A.civicaddress_id,
                    A.latitude_wgs,
                    A.longitude_wgs,
                    A.zoning,
                    A.zoning_links,
					A.jurisdiction_type,
                    A.owner_address,
                    A.location_type,
                    A.polygon,
					A.historic_district,
					A.local_landmark
            FROM simplicity.v_simplicity_properties AS A
            LEFT JOIN internal.bc_street AS B
            ON ST_DWithin(B.shape, A.shape, ldist)
            WHERE B.centerline_id = cid[i]
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END

$BODY$;

