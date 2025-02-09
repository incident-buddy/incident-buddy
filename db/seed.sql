insert into tenants (id, name) values ('1', 'Zarafa');
insert into users (id, family_name, given_name, tenant_id) values ('1', '田所', '駿佑', '1');
insert into user_emails (id, user_id, email, verified, tenant_id) values ('1', '1', 's.tadokoro0317+ib@gmail.com', true, '1');
insert into resource_masters (id, name, description, code, category, tenant_id) 
values ('1', 'チーム', null, 'team', 'team', '1'),
       ('2', 'サービス', '影響サービス', 'affected-service', 'service', '1'),
       ('3', '機能', '影響機能', 'affected-feature', 'feature', '1'),
       ('4', '顧客', '影響顧客', 'affected-customer', 'customer', '1');

insert into resource_attributes (id, name, code, value_type, is_array, resource_master_id, tenant_id)
values ('1', 'チーム名', 'team-name', 'std:text', false, '1', '1'),
       ('2', 'メンション', 'team-slack-mention', 'slack:mention', false, '1', '1'),
       ('3', 'サービス名', 'service-name', 'std:text', false, '2', '1'),
       ('4', '機能名', 'feature-name', 'std:text', false, '3', '1'),
       ('5', '顧客名', 'customer-name', 'std:text', false, '4', '1')
       ('6', '担当セールス', 'sales', 'ref:user', true, '4', '1');

