
-- drop materialized view simplicity.m_v_link_permits_along_street;

create materialized view simplicity.m_v_link_permits_along_street as
select B.centerline_id, A.permit_number
from simplicity.m_v_simplicity_permits AS A
LEFT JOIN internal.bc_street AS B
ON ST_DWithin(B.shape, ST_Transform(ST_SetSRID(ST_Point(A.x, A.y),4326),2264), 110);

-- To refresh the materialized view
-- refresh materialized view concurrently simplicity.m_v_link_permits_along_street;