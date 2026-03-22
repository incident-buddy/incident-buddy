# Incident Config

## Severities

### Critical
本番サービスが完全停止している。全ユーザーに影響し、売上・信頼に直結する。即時対応必須。

### High
本番サービスが部分的に影響を受けている。一部ユーザーに影響し、機能が著しく劣化している。

### Medium
機能の一部が劣化しているが、代替手段がある。業務継続は可能。

### Low
軽微な問題。ユーザー影響は限定的で、次の通常リリースで対応可能。

## Services

### payment-api
決済処理サービス。カード決済・請求処理を担当。障害時の事業影響が最大。

### user-service
ユーザー管理サービス。認証・プロフィール・権限管理を担当。

### platform
プラットフォーム基盤。インフラ・共通ライブラリ・CI/CDを担当。

## Roles

### commander
コマンダー。インシデント全体の指揮を担当。ステークホルダーへの報告責任者。

### investigator
調査担当。原因究明・ログ解析・再現手順の特定を担当。

### communicator
コミュニケーター。社内外への状況共有・ステータスページ更新を担当。

## Notification Rules

### Payment High or Above
- severity: >= High
- service: payment-api
- mention: @U09MBMLF7C4 @U09MM2QHURX

### All Critical Incidents
- severity: Critical
- mention: @U09M85QNKL2 @U09MBMLF7C4 @U09MM2QHURX @U09N2DV9WAU

### Platform Any
- service: platform
- mention: @U09MM2QHURX
