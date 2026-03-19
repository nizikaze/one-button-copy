# One Button Copy

名前付きテキストを保存し、一覧からワンクリックでコピーできる静的 Web アプリです。
https://nizikaze.github.io/one-button-copy/

## 公開方法

1. このリポジトリを GitHub に push する
2. GitHub の `Settings` → `Pages` を開く
3. `Build and deployment` の `Source` で `Deploy from a branch` を選ぶ
4. Branch は公開したいブランチ、Folder は `/` を選ぶ
5. 保存後、公開 URL は通常 `https://<GitHubユーザー名>.github.io/<リポジトリ名>/` になる
6. 今回はユーザー名が `nizikaze`、リポジトリ名が `one-button-copy` なので `https://nizikaze.github.io/one-button-copy/` でアクセスできる

## ファイル構成

- `index.html`: 画面構成
- `styles.css`: スタイル
- `app.js`: 保存、検索、編集、削除、コピー処理
- `docs/仕様書.md`: 元の要件メモ

## 保存仕様

- データはブラウザの `localStorage` に保存されます
- 保存先キーは `one-button-copy.entries` です

## 補足

- 現在の構成は GitHub Pages のルート公開に適しています
- 追加のビルドや依存関係は不要です
