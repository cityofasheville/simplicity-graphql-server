-- FUNCTION: amd.get_search_streets(character varying[], integer[])

-- DROP FUNCTION amd.get_search_streets(character varying[], integer[]);

CREATE OR REPLACE FUNCTION amd.get_search_streets(
	lstreetname character varying[],
	lzipcode integer[])
RETURNS SETOF amd.v_simplicity_streets 
    LANGUAGE 'plpgsql'
    COST 100.0
    VOLATILE 
    ROWS 1000.0
AS $function$

DECLARE
    r amd.v_simplicity_streets%rowtype;
BEGIN
	for i in 1..array_length(lstreetname,1) loop
    	FOR r IN (
                select centerline_id, full_street_name, lzip as left_zipcode, rzip as right_zipcode,
            			st_astext(st_transform(shape, 4326)) AS line
                from amd.bc_street 
                where street_name = lstreetname[i]
                and   (lzip = lzipcode[i] OR rzip = lzipcode[i])
            )
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END

$function$;
