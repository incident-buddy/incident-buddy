-- name: FindTriggeringWorkflow :many
select
    w.id,
    w.name,
    w.trigger,
    wv.id as "version_id",
    wv.version,
    wv.steps
from workflows w
inner join workflow_versions wv on w.id = wv.workflow_id and wv.is_latest
where w.tenant_id = $1 and w.trigger = $2;