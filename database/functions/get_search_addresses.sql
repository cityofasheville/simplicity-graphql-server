
-- DROP FUNCTION simplicity.get_search_addresses(character varying[], character varying[], character varying[], character varying[], character varying[], character varying[], character varying[]);

CREATE OR REPLACE FUNCTION simplicity.get_search_addresses(
lnumber character varying[], 
lstreetname character varying[], 
ltype character varying[], 
lprefix character varying[], 
lunit character varying[], 
lzipcode character varying[], 
lcity character varying[]
)
 RETURNS SETOF internal.coa_bc_address_master
 LANGUAGE plpgsql
AS $function$
begin
	return query select coa_bc_address_master.*
                 from internal.coa_bc_address_master
	inner join unnest(lnumber, lstreetname, ltype, lprefix, lunit, lzipcode, lcity) as params(lnumber, lstreetname, ltype, lprefix, lunit, lzipcode, lcity)
	on    address_number::text = params.lnumber
    and   trim(address_street_name) = params.lstreetname
    and   trim(address_street_type) = params.ltype         	 
    and   (params.lcity = '' OR address_commcode = params.lcity) -- Sometime input lacks city
    and   (address_unit = params.lunit OR (trim(address_unit) = params.lunit OR address_unit IS NULL))
    and   (trim(address_street_prefix) = params.lprefix OR address_street_prefix IS null)
    where (location_type = 1 OR location_type = 4);
END
$function$
;


