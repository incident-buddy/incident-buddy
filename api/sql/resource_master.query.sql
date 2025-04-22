-- name: ListResourceMaster :many
-- List all resource_masters
select
    rm.id,
    rm.name,
    rm.code,
    rm.description,
    rm.icon_type,
    rm.icon_color,
    rm.tenant_id
from resource_masters rm
where tenant_id = @tenant_id::text
order by rm.code
;