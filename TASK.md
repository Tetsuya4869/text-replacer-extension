# Chrome拡張機能 開発チェックリスト

## 1. 企画・設計フェーズ

### 要件定義
- [x] 拡張機能の目的・解決する課題を明確化
- [x] ターゲットユーザーの定義
- [x] 必要な機能の洗い出し（MVP / Nice-to-have の分類）
- [ ] 競合拡張機能の調査

### 技術設計
- [x] Manifest Version の選定（V3 を推奨）
- [x] 必要な権限（permissions）の洗い出し
- [x] アーキテクチャ構成の決定
  - Background（Service Worker）の要否
  - Content Script の要否
  - Popup UI の要否
  - Options ページの要否
  - Side Panel の要否
  - DevTools パネルの要否
- [x] 使用する API の選定（chrome.storage, chrome.tabs, chrome.runtime 等）
- [x] 外部 API との連携有無の確認
- [x] データの保存方式の決定（chrome.storage.local / sync / session）

---

## 2. 環境構築フェーズ

### プロジェクトセットアップ
- [x] リポジトリの作成（Git 初期化）
- [x] ディレクトリ構成の決定
- [x] ビルドツールの選定・設定（Webpack / Vite / Rollup / なし）
- [ ] TypeScript 導入の検討・設定
- [ ] Linter / Formatter の設定（ESLint, Prettier）
- [x] `.gitignore` の設定

### 推奨ディレクトリ構成

```
text-replacer-extension/
├── background.js          # Service Worker
├── content.js             # Content Script
├── utils.js               # 共通ユーティリティ
├── popup/                 # Popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/               # Options ページ
│   ├── options.html
│   ├── options.css
│   └── options.js
├── icons/                 # アイコン画像
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
├── build.sh               # ZIP ビルドスクリプト
├── .gitignore
└── TASK.md
```

---

## 3. manifest.json の設定

### 基本設定
- [x] `manifest_version`: 3
- [x] `name`: 拡張機能名（45文字以内）
- [x] `version`: セマンティックバージョニング（例: "1.0.0"）
- [x] `description`: 説明文（132文字以内）
- [x] `icons`: 16px, 32px, 48px, 128px の各サイズを用意

### 権限設定
- [x] `permissions`: 必要最小限の権限のみ指定
- [x] `optional_permissions`: 不要な権限を削除（host_permissions, scripting 廃止）
- [x] `host_permissions`: 静的 content_scripts により不要化・削除済み
- [x] `content_security_policy`: `extension_pages` に `script-src 'self'; object-src 'self';` を設定

### コンポーネント設定
- [x] `background.service_worker`: Service Worker の指定
- [x] `content_scripts`: マッチパターン・スクリプト・CSS の指定
- [x] `action`: Popup HTML / アイコン / ツールチップの指定
- [x] `options_page` または `options_ui`: オプションページの指定
- [x] `commands`: キーボードショートカットの設定

---

## 4. 実装フェーズ

### Service Worker（Background）
- [x] イベントリスナーはトップレベルで登録
- [x] グローバル変数に状態を保持しない（Service Worker は停止・再起動される）
- [x] `chrome.storage` を使った状態管理
- [x] メッセージパッシング（`chrome.runtime.onMessage`）の実装

### Content Script
- [x] DOM 操作のタイミング制御（`document_idle`）
- [x] ページの既存スタイル・スクリプトとの干渉回避
- [x] MutationObserver による動的コンテンツへの対応（デバウンス付き）
- [x] メッセージパッシングによる Background との通信
- [x] 編集可能要素（contenteditable, textarea, input）のスキップ

### Popup / Options UI
- [x] UI フレームワークの選定（Vanilla JS）
- [x] ユーザー設定の保存・読み込み処理
- [x] ローディング・エラー状態の UI 表示
- [x] 正規表現ルールのサポート
- [x] インポート / エクスポート機能
- [x] 一括削除と確認ダイアログ

### 共通
- [x] エラーハンドリングの実装
- [x] `chrome.runtime.lastError` のチェック
- [x] 非同期処理の適切な使用
- [x] コンポーネント間のメッセージパッシング設計
- [x] 共通ユーティリティ（utils.js）の分離

---

## 5. セキュリティチェック

- [x] `eval()` や `innerHTML` の使用を避ける（XSS 対策）→ 安全な DOM API に置き換え済み
- [x] ユーザー入力のサニタイズ
- [x] `host_permissions` の最小権限原則
- [x] `web_accessible_resources` の範囲を限定（未定義のため公開リソースなし）
- [x] Cross-Origin 通信の制御（`host_permissions` 未使用・外部通信API未実装）

---

## 6. テストフェーズ

### 手動テスト
- [ ] `chrome://extensions` での読み込み・動作確認
- [ ] 各コンポーネント（Popup, Content Script, Background）の個別動作確認
- [ ] 複数タブ・ウィンドウでの動作確認
- [ ] 拡張機能の有効化・無効化の切り替えテスト
- [ ] ブラウザ再起動後の動作確認
- [ ] シークレットモードでの動作確認

### エッジケース
- [ ] オフライン時の動作
- [ ] 権限が拒否された場合の動作
- [ ] 大量データ処理時のパフォーマンス
- [ ] 他の拡張機能との競合チェック
- [ ] 対象サイトの DOM 変更時の耐性

---

## 7. パフォーマンス最適化

- [x] Content Script のバンドルサイズ削減（共通ユーティリティ分離）
- [x] MutationObserver のデバウンス処理
- [x] `chrome.storage` の読み書き回数の最適化（デバウンス保存）
- [ ] メモリリークのチェック（DevTools → Memory タブ）

---

## 8. ストア公開準備

### アセット準備
- [x] アイコン画像（16px, 32px, 48px, 128px）
- [x] プロモーション用タイル画像（440x280px）
- [x] スクリーンショット（1280x800px 推奨、最低1枚・最大5枚）

### ストア掲載情報
- [x] 拡張機能名（最終版）
- [ ] 詳細説明文（ストア掲載用）
- [ ] カテゴリの選定
- [ ] プライバシーポリシー URL

### コード準備
- [x] `console.log` / デバッグコードの除去
- [x] 本番用ビルドの作成（build.sh）
- [x] ソースコードの最終レビュー
- [x] `.zip` ファイルの作成（`node_modules`, `.git` 等を除外）

---

## クイックリファレンス

### よく使う Chrome API

| API | 用途 |
|---|---|
| `chrome.storage` | データの永続化 |
| `chrome.tabs` | タブの操作・情報取得 |
| `chrome.runtime` | メッセージパッシング・ライフサイクル |
| `chrome.action` | ツールバーアイコンの制御 |
| `chrome.scripting` | 動的スクリプト注入 |
| `chrome.commands` | キーボードショートカット |

### デバッグ Tips

- **Service Worker**: `chrome://extensions` → 「Service Worker」リンクをクリック
- **Content Script**: 対象ページの DevTools → Console（拡張機能のコンテキストに切替）
- **Popup**: Popup を右クリック →「検証」
- **Storage**: DevTools → Application → Extension Storage

### 参考リンク

- [Chrome Extensions ドキュメント](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 移行ガイド](https://developer.chrome.com/docs/extensions/develop/migrate)
- [Chrome Web Store ポリシー](https://developer.chrome.com/docs/webstore/program-policies/)
- [Chrome Extensions サンプル集](https://github.com/GoogleChrome/chrome-extensions-samples)
