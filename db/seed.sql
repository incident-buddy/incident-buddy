insert into tenants (id, name)
values ('0000000000000000TENANT_001', 'Zarafa');

insert into users (id, family_name, given_name, tenant_id, status)
values ('00000000TEAM_ECOM_USER_001', 'Eコマース', '開発者1', '0000000000000000TENANT_001', 'ACTIVE')
     , ('00000000TEAM_ECOM_USER_002', 'Eコマース', '開発者2', '0000000000000000TENANT_001', 'ACTIVE')
     , ('00000000TEAM_ECOM_USER_003', 'Eコマース', '開発者3', '0000000000000000TENANT_001', 'DISABLED')
     , ('000000TEAM_KESSAI_USER_001', '決済', '開発者1', '0000000000000000TENANT_001', 'ACTIVE')
     , ('000000TEAM_KESSAI_USER_002', '決済', '開発者2', '0000000000000000TENANT_001', 'ACTIVE')
;

insert into resource_masters (id, name, description, code, category, tenant_id)
values ('00RESOURCE_MASTER_SLACK_CH', 'Slackチャネル', 'Slackチャネル', 'slack-channel', 'communication', '0000000000000000TENANT_001')
     , ('00RESOURCE_MASTER_DEV_TEAM', '開発チーム', null, 'dev-team', 'team', '0000000000000000TENANT_001')
     , ('000000RESOURCE_MASTER_FEAT', '機能', '提供している機能', 'feature', 'feature', '0000000000000000TENANT_001')
;

insert into resource_master_attributes (id, name, code, value_type, resource_reference, is_array, order_no, resource_master_id, tenant_id)
values ('000000RMA_SLACK_CHANNEL_ID', 'SlackチャネルID', 'slack-channel-id', 'slack:channel:id', null                        , false, '1', '00RESOURCE_MASTER_SLACK_CH', '0000000000000000TENANT_001')
     , ('00000000000RMA_TEAM_MEMBER', 'メンバー'       , 'member'          , 'std:user'        , null                        , true , '1', '00RESOURCE_MASTER_DEV_TEAM', '0000000000000000TENANT_001')
     , ('00000000RMA_DEV_TEAM_SLACK', 'Slackチャネル'  , 'slack-channel'   , 'slack:channel'   , '00RESOURCE_MASTER_SLACK_CH', false, '2', '00RESOURCE_MASTER_DEV_TEAM', '0000000000000000TENANT_001')
     , ('00000000RMA_FEAT_RESP_TEAM', '担当チーム'     , 'responsible-team', 'reference'       , '00RESOURCE_MASTER_DEV_TEAM', false, '2', '000000RESOURCE_MASTER_FEAT', '0000000000000000TENANT_001')
;

insert into resources (id, name, code, resource_master_id, tenant_id)
values ('00000000ECOM_TEAM_SLACK_CH', 'EコマースチームのSlackチャネル', 'ecom-team-slack', '00RESOURCE_MASTER_SLACK_CH', '0000000000000000TENANT_001')
     , ('0000000000000RES_ECOM_TEAM', 'Eコマースチーム', 'ecom-team', '00RESOURCE_MASTER_DEV_TEAM', '0000000000000000TENANT_001')
     , ('00000000000000ECOM_FEATURE', 'Eコマース機能', 'ecom-feature', '000000RESOURCE_MASTER_FEAT', '0000000000000000TENANT_001')
;

insert into resource_attribute_values (id, resource_id, resource_master_attribute_id, tenant_id, attribute_value)
values ('00000ECOM_TEAM_SLACK_CH_ID', '00000000ECOM_TEAM_SLACK_CH', '000000RMA_SLACK_CHANNEL_ID', '0000000000000000TENANT_001', '"G05EXVALLDU"'::jsonb)
     , ('0000000000ECOM_TEAM_MEMBER', '0000000000000RES_ECOM_TEAM', '00000000000RMA_TEAM_MEMBER', '0000000000000000TENANT_001', '["00000000TEAM_ECOM_USER_001", "00000000TEAM_ECOM_USER_002", "00000000TEAM_ECOM_USER_003"]'::jsonb)
     , ('00000000000ECOM_TEAM_SLACK', '0000000000000RES_ECOM_TEAM', '00000000RMA_DEV_TEAM_SLACK', '0000000000000000TENANT_001', '{"reference": "00000000ECOM_TEAM_SLACK_CH"}'::jsonb)
     , ('000000000000ECOM_RESP_TEAM', '00000000000000ECOM_FEATURE', '00000000RMA_FEAT_RESP_TEAM', '0000000000000000TENANT_001', '{"reference": "0000000000000RES_ECOM_TEAM"}'::jsonb)
;

insert into incident_statuses (id, name, status_type, color, tenant_id)
values ('1', 'インシデント検知', 'OPEN', 'RED', '0000000000000000TENANT_001')
     , ('2', '対応開始', 'ONGOING', 'ORANGE', '0000000000000000TENANT_001')
     , ('3', '緩和済', 'ONGOING', 'PURPLE', '0000000000000000TENANT_001')
     , ('4', '解決', 'RESOLVED', 'GRAY', '0000000000000000TENANT_001')
;

insert into incident_roles (id, name, code, tenant_id)
values ('1', 'インシデントコマンダー', 'incident-commander', '0000000000000000TENANT_001')
     , ('2', 'コミュニケーションリード', 'communication-lead', '0000000000000000TENANT_001')
     , ('3', 'オペレーター', 'operator', '0000000000000000TENANT_001')
;

insert into incidents (id, title, code, description, tenant_id, created_at, latest_status_id)
values ('1', 'カート機能が動かない', 'INC-1', 'カート機能が動かない', '0000000000000000TENANT_001', '2025-01-01 09:00:00', '4')
     , ('2', '決済機能が動かない', 'INC-2', '決済機能が動かない', '0000000000000000TENANT_001', '2025-01-02 10:00:00', '3')
     , ('3', '請求機能が動かない', 'INC-3', '請求機能が動かない', '0000000000000000TENANT_001', '2025-01-03 11:00:00', '2')
;
/*
insert into incident_event_histories (id, incident_id, event_type, event_body, placed_at, placed_by, external_platform,
                                      external_place, external_id, tenant_id)
values ('1',
        '1',
        'FILE_ATTACHMENT',
        '{
          "text": "**明らかに様子がおかしい**。スクリーンショットはこれです。",
          "files": [
            {
              "type": "image/png",
              "url": "https://placehold.co/600x400/png"
            }
          ]
        }',
        '2025-01-01 09:40:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('2',
        '1',
        'COMMENT',
        '{
          "text": "カート機能が動かないですね... :face_with_rolling_eyes:"
        }',
        '2025-01-01 09:42:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('3',
        '1',
        'STATUS_UPDATE',
        '{
          "before": {
            "id": "1",
            "name": "インシデント検知"
          },
          "after": {
            "id": "2",
            "name": "対応開始"
          }
        }',
        '2025-01-01 09:43:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('4',
        '1',
        'ROLE_ASSIGN',
        '{
          "add": [{
            "role": {
              "id": "1",
              "name": "インシデントコマンダー"
            },
            "user": {
                "id": "101",
                "family_name": "Eコマース",
                "given_name": "開発者1"
            }
          }]
        }',
        '2025-01-01 09:45:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('5',
        '1',
        'ROLE_ASSIGN',
        '{
          "add": [{
            "role": {
              "id": "2",
              "name": "コミュニケーションリード"
            },
            "user": {
              "id": "102",
              "family_name": "Eコマース",
              "given_name": "開発者2"
            }
          }]
        }',
        '2025-01-01 09:46:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('6',
        '1',
        'ROLE_ASSIGN',
        '{
          "add": [{
            "role": {
              "id": "3",
              "name": "オペレーター"
            },
            "user": {
              "id": "103",
              "family_name": "Eコマース",
              "given_name": "開発者3"
            }
          }]
        }',
        '2025-01-01 09:47:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('7',
        '1',
        'COMMENT',
        '{
          "text": "サーバーの再起動を試してみます"
        }',
        '2025-01-01 10:25:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('8',
        '1',
        'COMMENT',
        '{
          "text": "**直ったっぽい！** :tada:",
          "files": [
            {
              "type": "image/png",
              "url": "https://placehold.co/600x400/png"
            }
          ]
        }',
        '2025-01-01 10:30:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '1'),
       ('9',
        '0000000000000000TENANT_001',
        'STATUS_UPDATE',
        '{
            "before": {
                "id": "2",
                "name": "対応開始"
            },
            "after": {
                "id": "3",
                "name": "緩和済"
            }
        }',
        '2025-01-01 10:31:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('10',
        '1',
        'COMMENT',
        '{
          "text": "よくわからないけど直ったみたいなので、とりあえずクローズします"
        }',
        '2025-01-01 10:50:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001'),
       ('11',
        '1',
        'STATUS_UPDATE',
        '{
          "before": {
            "id": "3",
            "name": "緩和済"
          },
          "after": {
            "id": "4",
            "name": "解決"
          }
        }',
        '2025-01-01 11:00:00',
        '101',
        'SLACK',
        'C05EXVALLDU',
        '1716355097.537659',
        '0000000000000000TENANT_001')
;

insert into workflows (id, name, trigger, tenant_id)
values ('1', 'When an incident declared, notify to the team', 'INCIDENT_CREATED', '0000000000000000TENANT_001')
;

insert into workflow_versions (id, workflow_id, version, is_latest, steps, tenant_id)
values ('1', '1', '1', false, '{
"steps": [
  {
    "code": "slack:post-message",
    "SlackPostParams": {
      "channel": "some-slack-channel",
      "message": "OOPS"
    }
  },
  {
    "code": "sms:send",
    "smsSendParams": {
      "phoneNumber": "09012345678",
      "message": "OOPS"
    }
  }
]
}', '0000000000000000TENANT_001'),
('2', '1', '2', true, '{
"steps": [
  {
    "code": "slack:post-message",
    "slackPostParams": {
      "channel": "some-slack-channel",
      "message": "An incident has occurred. Please take action."
    }
  },
  {
    "code": "sms:send",
    "smsSendParams": {
      "phoneNumber": "09012345678",
      "message": "OOPS! An incident has occurred. Please take action."
    }
  }
]
}', '0000000000000000TENANT_001')
;
*/