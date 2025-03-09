-- dialect: postgresql

create table tenants
(
    id   text primary key,
    name text not null
);

create table users
(
    id          text primary key,
    family_name text not null,
    given_name  text not null,
    status      text not null,
    tenant_id   text not null references tenants (id)
);

create index users__ti_s on users (tenant_id, status);

create table user_emails (
    id        text primary key,
    user_id   text    not null references users (id),
    email     text    not null,
    verified  boolean not null default false,
    tenant_id text    not null references tenants (id)
);

-- unique(email, tenant_id) はpsqldefではsyntax error
alter table user_emails add constraint user_emails__unique_email unique (email, tenant_id);

create index user_emails__ui on user_emails (user_id);

create table resource_masters
(
    id          text primary key,
    name        text not null,
    description text,
    code        text not null,
    category    text not null,
    tenant_id   text not null references tenants (id)
);

create index resource_masters__ti_ca_co on resource_masters (tenant_id, category, code);

create table resource_attributes
(
    id                 text primary key,
    name               text    not null,
    code               text    not null,
    value_type         text    not null,
    is_array           boolean not null default false,
    resource_master_id text    not null references resource_masters (id),
    tenant_id          text    not null references tenants (id)
);

create index resource_attributes__rm_co on resource_attributes (resource_master_id, code);

create table resource_entries
(
    id                 text primary key,
    name               text  not null,
    code               text  not null,
    attribute_values   jsonb not null,
    resource_master_id text  not null references resource_masters (id),
    tenant_id          text  not null references tenants (id)
);

create index resource_entries__rm_co on resource_entries (resource_master_id, code);
create index resource_entries__ti on resource_entries (tenant_id);

create table incident_statuses
(
    id          text primary key,
    name        text not null,
    status_type text not null,
    color       text not null,
    tenant_id   text not null references tenants (id)
);

create table incident_roles
(
    id        text primary key,
    name      text not null,
    code      text not null,
    tenant_id text not null references tenants (id)
);

create table incidents
(
    id               text primary key,
    title            text      not null,
    code             text      not null,
    description      text,
    created_at       timestamp not null,
    latest_status_id text      not null references incident_statuses (id),
    tenant_id        text      not null references tenants (id)
);

create table incident_role_assignments
(
    id          text primary key,
    incident_id text      not null references incidents (id),
    role_id     text      not null references incident_roles (id),
    user_id     text      not null references users (id),
    assigned_at timestamp not null,
    assigned_by text      null references users (id), -- システムユーザーではない人が割り当てるケースがあるのでnullableは仕方ない
    tenant_id   text      not null references tenants (id)
);

create index incident_role_assignments__ti_ii_ri on incident_role_assignments (tenant_id, incident_id, role_id);

create table incident_event_histories
(
    id                text primary key,
    incident_id       text      not null references incidents (id),
    event_type        text      not null,
    event_body        jsonb     not null,
    placed_at         timestamp not null,
    placed_by         text      null references users (id),
    external_platform text,
    external_place    text,
    external_id       text,
    tenant_id         text      not null references tenants (id)
);

create index incident_event_histories__ti_ii_et_ra on incident_event_histories (tenant_id, incident_id, event_type, placed_at);
create index incident_event_histories_ti_ii_ep_ecp_eci on incident_event_histories (tenant_id, incident_id,
                                                                                    external_platform, external_place,
                                                                                    external_id);

comment on column incident_event_histories.event_type is 'COMMENT, MODIFY, DELETE';
comment on column incident_event_histories.external_platform is 'eg. SLACK';
comment on column incident_event_histories.external_place is 'eg. #inc-123_cart-outage';
comment on column incident_event_histories.external_id is 'eg. 1234567890.123456';


create table workflows
(
    id        text primary key,
    name      text not null,
    trigger   text not null,
    tenant_id text not null references tenants (id)
);

create index workflows__ti_tr on workflows (tenant_id, trigger);

create table workflow_versions
(
    id          text primary key,
    workflow_id text    not null references workflows (id),
    version     text    not null,
    is_latest   boolean not null default false,
    steps       jsonb   not null default '[]'::jsonb,
    tenant_id   text    not null references tenants (id)
);

create index workflow_versions__ti_wi_il on workflow_versions (tenant_id, workflow_id, is_latest);

create table workflow_executions
(
    id                  text primary key,
    workflow_id         text      not null references workflows (id),
    workflow_version_id text      not null references workflow_versions (id),
    status              text      not null,
    started_at          timestamp not null,
    finished_at         timestamp,
    tenant_id           text      not null references tenants (id)
);
create index workflow_executions__ti_sa_s on workflow_executions (tenant_id, started_at, status);

