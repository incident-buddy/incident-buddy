-- dialect: postgresql

create table tenants (
  id text primary key,
  name text not null
);

create table users (
  id text primary key,
  family_name text not null,
  given_name text not null,
  tenant_id text not null references tenants(id)
);

create table user_emails (
  id text primary key,
  user_id text not null references users(id),
  email text not null,
  verified boolean not null default false,
  tenant_id text not null references tenants(id),
  unique(user_id, email)
);

create table resource_masters (
  id text primary key,
  name text not null,
  description text,
  code text not null,
  category text not null,
  tenant_id text not null references tenants(id)
);

create table resource_attributes (
  id text primary key,
  name text not null,
  code text not null,
  value_type text not null,
  is_array boolean not null default false,
  resource_master_id text not null references resource_masters(id),
  tenant_id text not null references tenants(id)
);


create table resource_entiries (
  id text primary key,
  name text not null,
  code text not null,
  resource_master_id text not null references resource_masters(id),
  tenant_id text not null references tenants(id)
);

create table resource_entry_attribute_values (
  id text primary key,
  resource_attribute_id text not null references resource_attributes(id),
  resource_entry_id text not null references resource_entiries(id),
  value jsonb not null,
  tenant_id text not null references tenants(id),
  unique(resource_attribute_id, resource_entry_id)
);