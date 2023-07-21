
-- DROP FUNCTION simplicity.get_search_streets(character varying[], character varying[], character varying[]);

CREATE OR REPLACE FUNCTION simplicity.get_search_streets(lstreetname character varying[], lzipcode character varying[], lprefix character varying[])
 RETURNS SETOF simplicity.v_simplicity_streets
 LANGUAGE plpgsql
AS $function$
begin
	return query select centerline_id, full_street_name, lzip as left_zipcode, rzip as right_zipcode,
			left_from_address, right_from_address,
			left_to_address, right_to_address,																					
			st_astext(st_transform(shape, 4326)) AS line
	from internal.bc_street str
	inner join unnest(lstreetname,lzipcode,lprefix) as params(lstreetname,lzipcode,lprefix)
	on str.street_name = params.lstreetname
	and   (str.lzip::text = params.lzipcode OR params.lzipcode = '')
	and   (str.street_prefix = params.lprefix OR params.lprefix = '');
END
$function$
;


