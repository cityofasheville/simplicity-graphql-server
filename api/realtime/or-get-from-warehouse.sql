-- instead of using proj4 I could pull lat/long from warehouse
SELECT DISTINCT
        ST_X(ST_TRANSFORM(bc_location.shape,4326)) AS longitude_wgs,
        ST_Y(ST_TRANSFORM(bc_location.shape,4326)) AS latitude_wgs
FROM
        bc_civicaddress_table
LEFT JOIN
        bc_location
ON
        bc_civicaddress_table.location_id = bc_location.location_id
WHERE bc_civicaddress_table.civicaddress_id = 219878
        