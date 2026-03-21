# Incident Config

## Severities

### P1
Critical

### P2
High

### P3
Medium

### P4
Low

## Services

### api
APIサーバー

### web
Webフロントエンド

### db
データベース

## Notification Rules

### Notify P1
- severity: P1
- channel: #incidents
- mention: @here

### Notify P1 DB
- severity: P1
- service: db
- channel: #incidents
- mention: @channel
