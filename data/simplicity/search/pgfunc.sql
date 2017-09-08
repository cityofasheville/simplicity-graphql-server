CREATE OR REPLACE FUNCTION amd.get_all_foo(
    	lnumber int[],
    	lstreetname varchar[],
    	ltype varchar[],
    	lprefix varchar[],
    	lunit varchar[],
    	lzipcode int[],
    	lcity varchar[]
	)
	RETURNS SETOF amd.coa_bc_address_master AS
$BODY$
DECLARE
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
$BODY$
LANGUAGE plpgsql;

-- select * from amd.get_all_foo('{283843,2,4,5,6}'::INT[], '{"one", "two", "three", "four", "five", "six"}'::VARCHAR[])

