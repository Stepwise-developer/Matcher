# omatcha

React、Rust、nginx を docker compose で起動する最小構成。

外部からは nginx が `443` ポートで HTTPS 接続を受け付け、パスごとに内部コンテナへ振り分ける。



## workspace

`workspace` 配下は、各コンテナにアタッチされる作業ディレクトリ。

| ディレクトリ | コンテナ | 説明 |
| --- | --- | --- |
| `workspace/react` | `omatcha_react` | React アプリケーション用。Vite で起動し、内部では `5173` ポートで待ち受ける。 |
| `workspace/rust` | `omatcha_rust` | Rust API 用。`cargo run` で起動し、内部では `8080` ポートで待ち受ける。 |
| `workspace/nginx` | `omatcha_nginx` | nginx の設定ファイルを配置する。`default.conf` を nginx コンテナへマウントする。 |

## listen とルーティング

nginx は `workspace/nginx/default.conf` で以下のように設定している。

```nginx
listen 443 ssl;
```

これにより、外部からの HTTPS 接続を `443` ポートで受け付ける。

`docker-compose.yml` では以下の設定により、ホスト側の `443` ポートを nginx コンテナの `443` ポートへ公開している。

```yaml
ports:
  - "443:443"
```

## エンドポイント

### `/matcha/`

React アプリケーションへの入口。

外部から `https://<host>/matcha/` にアクセスすると、nginx が内部の React コンテナへ転送する。

転送先:

```text
react:5173
```

### `/matcha-api/`

Rust API への入口。

外部から `https://<host>/matcha-api/` にアクセスすると、nginx が内部の Rust コンテナへ転送する。

転送先:

```text
rust:8080
```

## 起動

```bash
docker compose up -d
```

起動後、以下で確認できる。

```bash
curl -k https://localhost/matcha/
curl -k https://localhost/matcha-api/
```
