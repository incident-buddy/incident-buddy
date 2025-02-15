-- name: StoreIncident :one
insert into incidents (
    id, title, code, description, tenant_id, created_at, latest_status_id
) values (
    $1,
    $2,
    $3,
    $4,
    $5,
    current_timestamp,
    $6
) on conflict (id) do update
set title = excluded.title,
    code = excluded.code,
    description = excluded.description,
    tenant_id = excluded.tenant_id,
    latest_status_id = excluded.latest_status_id
returning *;

-- name: ListIncidents :many
select i.id,
       i.title,
       i.code,
       i.tenant_id,
       i.created_at,
       sta.name  as status_name,
       sta.color as status_color,
       sta.status_type
from incidents i
         inner join incident_statuses sta on i.latest_status_id = sta.id
where i.tenant_id = $1
order by i.created_at desc;

-- name: FetchIncident :one
select i.id,
       i.title,
       i.code,
       i.description,
       i.tenant_id,
       i.created_at,
       sta.status_type,
       sta.name  as status_name,
       sta.color as status_color
from incidents i
         inner join incident_statuses sta on i.latest_status_id = sta.id
where i.id = $1
  and i.tenant_id = $2;

-- name: ListLatestIncidentAssignments :many
select ra.id,
       ra.incident_id,
       ra.role_id,
       ra.user_id,
       ra.assigned_at,
       ra.assigned_by,
       r.name as role_name,
       r.code as role_code
from incident_role_assignments ra
         inner join incident_roles r on ra.role_id = r.id
where ra.incident_id = $1
  and ra.tenant_id = $2;