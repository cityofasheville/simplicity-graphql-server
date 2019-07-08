-- FUNCTION: simplicity.get_search_addresses(integer[], character varying[], character varying[], character varying[], character varying[], integer[], character varying[])

-- DROP FUNCTION simplicity.get_search_addresses(integer[], character varying[], character varying[], character varying[], character varying[], integer[], character varying[]);

CREATE OR REPLACE FUNCTION simplicity.get_search_addresses(
	lnumber integer[],
	lstreetname character varying[],
	ltype character varying[],
	lprefix character varying[],
	lunit character varying[],
	lzipcode integer[],
	lcity character varying[],
	laddress_x float[],
	laddress_y float[])
    RETURNS SETOF internal.coa_bc_address_master 
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
    ROWS 1000
AS $BODY$

DECLARE
    r internal.coa_bc_address_master%rowtype;
BEGIN
	for i in 1..array_length(lnumber,1) loop
    	FOR r IN (
                select *
                from internal.coa_bc_address_master 
                where (location_type = 1 OR location_type = 4)
            	and   address_number = lnumber[i]
                and   address_street_name = lstreetname[i]
                and   address_street_type = ltype[i]
                and   (lcity[i] = '' OR address_commcode = lcity[i]) -- Sometime input lacks city
                and   (address_unit = lunit[i] OR (trim(BOTH FROM address_unit) = lunit[i] OR address_unit IS NULL))
                and   (address_street_prefix = lprefix[i] OR (trim(BOTH FROM address_street_prefix) = lprefix[i] OR address_street_prefix IS NULL))
                and   address_x = laddress_x[i]
                and   address_y = laddress_y[i]
            )
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END

$BODY$;


