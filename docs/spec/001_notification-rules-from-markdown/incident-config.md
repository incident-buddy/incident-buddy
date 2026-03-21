# Incident Config

## Severities

### Critical
本番サービスが完全停止している

### High
本番サービスが部分的に影響を受けている

### Medium
機能の一部が劣化している

### Low
軽微な問題

## Services

### payment-api
決済処理サービス

### user-service
ユーザー管理サービス

### platform
プラットフォーム基盤

## Notification Rules

### Payment Critical
- severity: >= High
- service: payment-api
- channel: #payment-oncall
- mention: @payment-lead @oncall-group

### All Critical Incidents
- severity: Critical
- channel: #incidents-critical
- mention: @here

### Platform Any
- service: platform
- channel: #platform-alerts
