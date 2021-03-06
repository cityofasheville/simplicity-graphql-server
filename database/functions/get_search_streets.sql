-- FUNCTION: simplicity.get_search_streets(character varying[], integer[])

-- DROP FUNCTION simplicity.get_search_streets(character varying[], integer[]);

CREATE OR REPLACE FUNCTION simplicity.get_search_streets(
	lstreetname character varying[],
	lzipcode integer[])
    RETURNS SETOF simplicity.v_simplicity_streets 
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
    ROWS 1000
AS $BODY$

DECLARE
    r simplicity.v_simplicity_streets%rowtype;
BEGIN
	for i in 1..array_length(lstreetname,1) loop
    	FOR r IN (
                select centerline_id, full_street_name, lzip as left_zipcode, rzip as right_zipcode,
						left_from_address, right_from_address,
						left_to_address, right_to_address,																					
            			st_astext(st_transform(shape, 4326)) AS line
                from internal.bc_street 
                where street_name = lstreetname[i]
                and   (lzip = lzipcode[i] OR rzip = lzipcode[i])
            )
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END

$BODY$;


