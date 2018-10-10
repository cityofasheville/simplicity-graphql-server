CREATE OR REPLACE FUNCTION amd.get_search_addresses(lnumber integer[], lstreetname character varying[], ltype character varying[], lprefix character varying[], lunit character varying[], lzipcode integer[], lcity character varying[])
    RETURNS SETOF amd.coa_bc_address_master
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100.0ROWS 1000.0
AS $function$DECLARE
    r amd.coa_bc_address_master%rowtype;
BEGIN
	for i in 1..array_length(lnumber,1) loop
    	FOR r IN
    		select * from amd.coa_bc_address_master 
            where address_number = lnumber[i]
            and   address_street_name = lstreetname[i]
            and   address_street_type = ltype[i]
            and   address_commcode = lcity[i]
            and   (address_unit = lunit[i] OR (trim(BOTH FROM address_unit) = lunit[i] OR address_unit IS NULL))
            and   (address_street_prefix = lprefix[i] OR (trim(BOTH FROM address_street_prefix) = lprefix[i] OR address_street_prefix IS NULL))
		LOOP
			RETURN NEXT r; -- return current row of SELECT
        END LOOP;
    END LOOP;
    RETURN;
END
$function$;
