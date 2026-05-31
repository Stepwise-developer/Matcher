# API curl samples

Rustサーバーで提供するエンドポイントAPIは以下の通り

| エンドポイント | 役割 |
| --- | --- |
| `POST /api/registration/status` | ニックネームと生年月日でユーザーUUIDを登録・参照する |
| `POST /api/legal-consents` | 利用規約・プライバシーポリシーの同意を保存する |
| `POST /api/registration/profile` | プロフィールを登録・更新する |
| `GET /api/leveling/items` | レベリング項目を取得する |
| `POST /api/leveling/results` | レベリング回答を保存する |
| `GET /api/value-questions` | 価値観質問を取得する |
| `POST /api/value-answers` | 価値観回答を保存する |
| `GET /api/settings` | 設定画面用のプロフィールを取得する |
| `POST /api/feedback` | フィードバックを送信する |

エラー時は、基本的に以下の形式で返ります。

```json
{
  "error": {
    "code": "validation_error",
    "message": "入力内容に誤りがあります。",
    "fields": {
      "fieldName": "エラー内容"
    }
  }
}
```

主なエラーステータス:

| ステータス | 意味 |
| --- | --- |
| `400 Bad Request` | 送信内容に誤りがある |
| `404 Not Found` | 必要なデータが未登録 |
| `409 Conflict` | 登録しようとした内容が既に存在する |
| `500 Internal Server Error` | DB処理などサーバー側で失敗 |


## ユーザーUUID登録・参照

送信JSON(サンプル):

```json
{
  "register": false,
  "nickName": "matcha_taro",
  "birthDate": "2000-01-01"
}
```

`register` の意味:

| 値 | 動作 |
| --- | --- |
| `false` | `nickName` と `birthDate` でDBを参照し、既存の `userUuid` を返す |
| `true` | 新しい `userUuid` を生成し、`nickName` と `birthDate` と一緒に登録する |

```sh
# 参照
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -d '{"register":false,"nickName":"matcha_taro","birthDate":"2000-01-01"}' \
  "${BASE_URL}/api/registration/status"

# 登録
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -d '{"register":true,"nickName":"matcha_taro","birthDate":"2000-01-01"}' \
  "${BASE_URL}/api/registration/status"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | 参照または登録したユーザーUUIDを返す |
| `400 Bad Request` | `nickName` が空、または `birthDate` の形式が不正 |
| `404 Not Found` | `register: false` で該当ユーザーが存在しない |
| `409 Conflict` | `register: true` で同じ `nickName` と `birthDate` が既に存在する |

```json
{
  "data": {
    "userUuid": "2c15dc64-26f7-4210-a358-6fbfd5e2f927"
  }
}
```

## 規約同意保存

送信JSON(サンプル):

```json
{
  "consent": {
    "privacyPolicyAgreed": true,
    "privacyPolicyVersion": "1.0",
    "termsAgreed": true,
    "termsVersion": "1.0"
  }
}
```

```sh
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-UUID: ${USER_UUID}" \
  -d '{"consent":{"privacyPolicyAgreed":true,"privacyPolicyVersion":"1.0","termsAgreed":true,"termsVersion":"1.0"}}' \
  "${BASE_URL}/api/legal-consents"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | 同意保存成功 |
| `400 Bad Request` | 同意フラグが `false` |

```json
{
  "data": {
    "ok": true
  }
}
```

## プロフィール登録

送信JSON(サンプル):

```json
{
  "profile": {
    "name": "山田太郎",
    "age": "22",
    "gender": "male",
    "height": "170",
    "weight": "60",
    "area": "東京",
    "trainLine": "山手線"
  }
}
```

```sh
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-UUID: ${USER_UUID}" \
  -d '{"profile":{"name":"山田太郎","age":"22","gender":"male","height":"170","weight":"60","area":"東京","trainLine":"山手線"}}' \
  "${BASE_URL}/api/registration/profile"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | 保存後の登録状態を返す |

```json
{
  "data": {
    "registration": {
      "profile": {
        "name": "山田太郎",
        "age": "22",
        "gender": "male",
        "height": "170",
        "weight": "60",
        "area": "東京",
        "trainLine": "山手線"
      },
      "values": {},
      "valuesCompleted": false,
      "blockedLevelingIds": [
        "lv_cut_nails",
        "lv_daily_bath",
        "lv_daily_music",
        "lv_clean_clothes"
      ],
      "completedAt": "2026-05-24T12:00:00+09:00"
    }
  }
}
```

## レベリング項目取得

送信JSON: なし

```sh
curl -sS \
  "${BASE_URL}/api/leveling/items"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | レベリング項目一覧を返す |

```json
{
  "data": {
    "items": [
      {
        "id": "lv_cut_nails",
        "title": "爪を切る",
        "body": "爪を週に2回以上切っている",
        "criteria": "boolean"
      }
    ]
  }
}
```

## レベリング回答保存

送信JSON:

```json
{
  "result": {
    "itemId": "lv_cut_nails",
    "achieved": true,
    "answeredAt": "2026-05-24T12:00:00+09:00"
  }
}
```

```sh
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-UUID: ${USER_UUID}" \
  -d '{"result":{"itemId":"lv_cut_nails","achieved":true,"answeredAt":"2026-05-24T12:00:00+09:00"}}' \
  "${BASE_URL}/api/leveling/results"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | 保存後の登録状態を返す |

```json
{
  "data": {
    "registration": {
      "profile": {
        "name": "山田太郎",
        "age": "22",
        "gender": "male",
        "height": "170",
        "weight": "60",
        "area": "東京",
        "trainLine": "山手線"
      },
      "values": {},
      "valuesCompleted": false,
      "blockedLevelingIds": [
        "lv_daily_bath",
        "lv_daily_music",
        "lv_clean_clothes"
      ],
      "completedAt": "2026-05-24T12:00:00+09:00"
    }
  }
}
```

## 価値観質問取得

送信JSON: なし

```sh
curl -sS \
  "${BASE_URL}/api/value-questions"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | 価値観質問一覧を返す |

```json
{
  "data": {
    "questions": [
      {
        "id": "q_priority_action",
        "type": "ranking",
        "title": "行動の優先順位",
        "body": "次の項目を優先順位 1〜n で並べてください。",
        "options": [
          "家事をする",
          "知らない場所に行く",
          "溜めていた用事を片付ける",
          "友人や知人に会う"
        ]
      }
    ]
  }
}
```

## 価値観回答保存

送信JSON:

```json
{
  "answers": {
    "q_priority_action": {
      "type": "ranking",
      "order": [
        "家事をする",
        "溜めていた用事を片付ける",
        "知らない場所に行く",
        "友人や知人に会う"
      ]
    }
  }
}
```

```sh
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-UUID: ${USER_UUID}" \
  -d '{"answers":{"q_priority_action":{"type":"ranking","order":["家事をする","溜めていた用事を片付ける","知らない場所に行く","友人や知人に会う"]}}}' \
  "${BASE_URL}/api/value-answers"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | 保存後の登録状態を返す |
| `400 Bad Request` | `ranking` 以外の回答形式を送った |

```json
{
  "data": {
    "registration": {
      "profile": {
        "name": "山田太郎",
        "age": "22",
        "gender": "male",
        "height": "170",
        "weight": "60",
        "area": "東京",
        "trainLine": "山手線"
      },
      "values": {
        "q_priority_action": {
          "type": "ranking",
          "order": [
            "家事をする",
            "溜めていた用事を片付ける",
            "知らない場所に行く",
            "友人や知人に会う"
          ]
        }
      },
      "valuesCompleted": true,
      "blockedLevelingIds": [
        "lv_daily_bath",
        "lv_daily_music",
        "lv_clean_clothes"
      ],
      "completedAt": "2026-05-24T12:00:00+09:00"
    }
  }
}
```

## 設定取得

送信JSON: なし

```sh
curl -sS \
  -H "X-User-UUID: ${USER_UUID}" \
  "${BASE_URL}/api/settings"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | 設定画面用プロフィールを返す |
| `404 Not Found` | プロフィール未登録 |

```json
{
  "data": {
    "profile": {
      "name": "山田太郎",
      "age": "22",
      "gender": "male",
      "height": "170",
      "weight": "60",
      "area": "東京",
      "trainLine": "山手線"
    }
  }
}
```

## フィードバック送信

送信JSON:

```json
{
  "message": "改善要望です。",
  "screen": "settings",
  "sentAt": "2026-05-24T12:00:00+09:00"
}
```

```sh
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-UUID: ${USER_UUID}" \
  -d '{"message":"改善要望です。","screen":"settings","sentAt":"2026-05-24T12:00:00+09:00"}' \
  "${BASE_URL}/api/feedback"
```

レスポンス:

| ステータス | 結果 |
| --- | --- |
| `200 OK` | フィードバックIDを返す |
| `400 Bad Request` | `message` が空 |

```json
{
  "data": {
    "feedbackId": "fb_f242a5b3345748bda14990fe7974565d"
  }
}
```
