insert into tenants (id, name)
values ('1', 'Zarafa');

insert into users (id, family_name, given_name, tenant_id, status)
values ('101', 'Eコマース', '開発者1', '1', 'ACTIVE')
     , ('102', 'Eコマース', '開発者2', '1', 'ACTIVE')
     , ('103', 'Eコマース', '開発者3', '1', 'DISABLED')
     , ('201', '決済', '開発者1', '1', 'ACTIVE')
     , ('202', '決済', '開発者2', '1', 'ACTIVE')
     , ('301', '請求', '開発者1', '1', 'ACTIVE')
     , ('302', '請求', '開発者2', '1', 'ACTIVE')
     , ('401', '顧客A', 'セールス1', '1', 'ACTIVE')
     , ('402', '顧客A', 'セールス2', '1', 'ACTIVE')
     , ('501', 'SRE', 'エンジニア1', '1', 'ACTIVE')
     , ('502', 'SRE', 'エンジニア2', '1', 'ACTIVE')
     , ('601', '事業', '責任者1', '1', 'ACTIVE')
     , ('602', '事業', '責任者2', '1', 'ACTIVE')
;

insert into resource_masters (id, name, description, code, category, tenant_id)
values ('1', '開発チーム', null, 'dev-team', 'team', '1')
     , ('2', '機能', '影響機能', 'affected-feature', 'feature', '1')
     , ('3', 'インフラ', null, 'infra', 'service', '1')
     , ('4', '顧客', '影響顧客', 'affected-customer', 'customer', '1')
;

insert into resource_attributes (id, name, code, value_type, is_array, resource_master_id, tenant_id)
values ('101', 'Slackチャンネル', 'team-slack-channel', 'slack:channel', false, '1', '1')
     , ('102', '開発者', 'developer', 'std:user', true, '1', '1')
     , ('201', '機能概要', 'feature-description', 'std:text', false, '2', '1')
     , ('202', '担当チーム', 'feature-team', 'resource:dev-team', true, '2', '1')
     , ('301', '担当チーム', 'infra-team', 'resoure:dev-team', true, '3', '1')
     , ('401', '担当セールス', 'customer-sales', 'std:user', true, '4', '1')
;

insert into resource_entries (id, name, code, attribute_values, resource_master_id, tenant_id)
values ('101', 'Eコマースチーム', 'ecom-team', '{
  "team-slack-channel": {
    "value-type": "slack:channel",
    "value": "#ecom-dev-team"
  },
  "developer": {
    "value-type": "std:user",
    "value": [
      "101",
      "102",
      "103"
    ]
  }
}', '1', '1')
     , ('102', '決済チーム', 'payment-team', '{
  "team-slack-channel": {
    "value-type": "slack:channel",
    "value": "#payment-dev-team"
  },
  "developer": {
    "value-type": "std:user",
    "value": [
      "201",
      "202"
    ]
  }
}', '1', '1')
     , ('103', '請求チーム', 'billing-team', '{
  "team-slack-channel": {
    "value-type": "slack:channel",
    "value": "#billing-dev-team"
  },
  "developer": {
    "value-type": "std:user",
    "value": [
      "301",
      "302"
    ]
  }
}', '1', '1')
     , ('104', '顧客Aセールス', 'customer-a-sales', '{
  "team-slack-channel": {
    "value-type": "slack:channel",
    "value": "#customer-a-sales"
  },
  "developer": {
    "value-type": "std:user",
    "value": [
      "401",
      "402"
    ]
  }
}', '1', '1')
     , ('105', 'SREチーム', 'sre-team', '{
  "team-slack-channel": {
    "value-type": "slack:channel",
    "value": "#sre-team"
  },
  "developer": {
    "value-type": "std:user",
    "value": [
      "501",
      "502"
    ]
  }
}', '1', '1')
     , ('201', 'カート機能', 'cart-feature', '{
  "feature-description": {
    "value-type": "std:text",
    "value": "商品をカートに入れて購入する機能。\n大事だよ。"
  },
  "feature-team": {
    "value-type": "resource:dev-team",
    "value": [
      "101"
    ]
  }
}', '2', '1')
     , ('202', '決済機能', 'payment-feature', '{
  "feature-description": {
    "value-type": "std:text",
    "value": "商品を購入する機能。\n大事だよ。"
  },
  "feature-team": {
    "value-type": "resource:dev-team",
    "value": [
      "102"
    ]
  }
}', '2', '1')
     , ('203', '請求機能', 'billing-feature', '{
  "feature-description": {
    "value-type": "std:text",
    "value": "商品を購入した代金を請求する機能。\n大事だよ。"
  },
  "feature-team": {
    "value-type": "resource:dev-team",
    "value": [
      "103"
    ]
  }
}', '2', '1')
     , ('301', 'Kafka', 'kafka', '{
  "infra-team": {
    "value-type": "resource:dev-team",
    "value": [
      "105"
    ]
  }
}', '3', '1')
     , ('302', 'MySQL', 'mysql', '{
  "infra-team": {
    "value-type": "resource:dev-team",
    "value": [
      "101",
      "102",
      "103"
    ]
  }
}', '3', '1')
     , ('303', 'Redis', 'redis', '{
  "infra-team": {
    "value-type": "resource:dev-team",
    "value": [
      "101",
      "102",
      "103"
    ]
  }
}', '3', '1')
     , ('401', '顧客A', 'customer-a', '{
  "customer-sales": {
    "value-type": "std:user",
    "value": [
      "401",
      "402"
    ]
  }
}', '4', '1')
;

insert into incident_statuses (id, name, status_type, color, tenant_id)
values ('1', 'インシデント検知', 'OPEN', 'RED', '1')
     , ('2', '対応開始', 'ONGOING', 'ORANGE', '1')
     , ('3', '緩和済', 'ONGOING', 'PURPLE', '1')
     , ('4', '解決', 'RESOLVED', 'GRAY', '1')
;

insert into incident_roles (id, name, code, tenant_id)
values ('1', 'インシデントコマンダー', 'incident-commander', '1')
     , ('2', 'コミュニケーションリード', 'communication-lead', '1')
     , ('3', 'オペレーター', 'operator', '1')
;

insert into incidents (id, title, code, description, tenant_id, created_at, latest_status_id)
values ('1', 'カート機能が動かない', 'INC-1', 'カート機能が動かない', '1', '2025-01-01 09:00:00', '4')
     , ('2', '決済機能が動かない', 'INC-2', '決済機能が動かない', '1', '2025-01-02 10:00:00', '3')
     , ('3', '請求機能が動かない', 'INC-3', '請求機能が動かない', '1', '2025-01-03 11:00:00', '2')
;

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
        '1'),
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
        '1'),
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
        '1'),
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
        '1'),
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
        '1'),
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
        '1'),
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
        '1'),
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
        '1',
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
        '1'),
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
        '1'),
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
        '1')
;

insert into workflows (id, name, trigger, tenant_id)
values ('1', 'When an incident declared, notify to the team', 'INCIDENT_CREATED', '1')
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
}', '1'),
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
}', '1')
;