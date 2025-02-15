-- name: ListResourceMasters :many
select rm.id,
       rm.name,
       rm.code,
       rm.category,
       rm.tenant_id
from resource_masters rm
where rm.tenant_id = $1;

-- name: FetchResourceMaster :one
select rm.id,
       rm.name,
       rm.description,
       rm.code,
       rm.category,
       rm.tenant_id
from resource_masters rm
where rm.id = $1
  and rm.tenant_id = $2;

-- name: FetchResourceAttributes :many
select ra.id,
       ra.name,
       ra.code,
       ra.value_type,
       ra.is_array,
       ra.resource_master_id,
       ra.tenant_id
from resource_attributes ra
where ra.resource_master_id = $1
  and ra.tenant_id = $2;

-- name: ListResourceEntries :many
select re.id,
       re.name,
       re.code,
       re.attribute_values,
       re.resource_master_id,
       re.tenant_id,
       rm.id          as resource_master_id,
       rm.name        as resource_master_name,
       rm.code        as resource_master_code,
       rm.description as resource_master_description,
       rm.category    as resource_master_category
from resource_entries re
         inner join resource_masters rm on re.resource_master_id = rm.id
where re.tenant_id = $1
  and re.resource_master_id = $2;
