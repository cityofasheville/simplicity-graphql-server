-- FUNCTION: amd.get_addresses_by_neighborhood(character varying[])

-- DROP FUNCTION amd.get_addresses_by_neighborhood(character varying[]);

CREATE OR REPLACE FUNCTION amd.get_addresses_by_neighborhood(
	cid character varying[])
RETURNS SETOF amd.v_simplicity_addresses 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE 
    ROWS 1000
AS $BODY$

DECLARE
    r amd.v_simplicity_addresses%rowtype;
BEGIN
	for i in 1..array_length(cid,1) loop
    	FOR r IN
    		SELECT  A.civicaddress_id, A.address_full, A.address_city, A.address_zipcode, 
                A.address_number, A.address_unit, A.address_street_prefix, A.address_street_name, A.address_street_type,
                A.latitude_wgs, A.longitude_wgs,
                A.trash_pickup_day, A.recycling_pickup_district, A.recycling_pickup_day, 
                A.zoning, A.owner_name, A.owner_address, A.owner_cityname, A.owner_state, 
                A.owner_zipcode, A.property_pin, A.property_pinext, A.centerline_id,
                A.jurisdiction_type, A.shape,
				A.brushweek,
				A.nbrhd_id,
				A.nbrhd_name
            FROM amd.v_simplicity_addresses AS A
            WHERE A.nbrhd_id = cid[i]
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END

$BODY$;

ALTER FUNCTION amd.get_addresses_by_neighborhood(character varying[])
    OWNER TO coapgdbo;

