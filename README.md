# Text Replacer - テキスト変換辞書

辞書ベースでWebページのテキストを自動変換するChrome拡張機能です。

## 機能

- 変換前→変換後のルールを辞書として登録
- 正規表現による高度なパターンマッチング
- ワイルドカード対応のサイト指定（`*.example.com`）
- 動的コンテンツ（SPA等）への自動追従（MutationObserver）
- 何度適用しても元テキストから変換（重複変換なし）
- ルールのインポート / エクスポート（JSON）
- キーボードショートカット（`Alt+Shift+R`）

## インストール

1. このリポジトリをクローン
   ```bash
   git clone https://github.com/Tetsuya4869/text-replacer-extension.git
   ```
2. Chromeで `chrome://extensions` を開く
3. 右上の「デベロッパーモード」をONにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. クローンしたフォルダを選択

## 使い方

1. ツールバーの拡張機能アイコンをクリックしてポップアップを開く
2. 「対象サイト」に変換を適用したいサイトのホスト名を追加
3. 「変換ルール」に変換前・変換後のテキストを登録
4. 対象サイトを開くと自動でテキストが変換される

## ファイル構成

```
├── manifest.json          # 拡張機能の設定
├── background.js          # Service Worker
├── content.js             # ページ内テキスト変換
├── utils.js               # 共通ユーティリティ
├── popup/                 # ポップアップUI
├── options/               # 詳細設定ページ
├── icons/                 # アイコン画像
├── store-assets/          # ストア用画像
└── build.sh               # ZIP ビルドスクリプト
```

## ビルド

Chrome Web Store 提出用のZIPファイルを作成:

```bash
./build.sh
```

## ライセンス

MIT
