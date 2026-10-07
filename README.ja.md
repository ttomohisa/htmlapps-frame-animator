# Frame Animator

Frame Animatorは、複数のローカル画像からAnimated GIF / WebPを作るためのBrowser Kittyツールです。選択した画像を変換サーバーへアップロードせず、ブラウザ内で処理する構成を目指します。

> 現在の開発版は **v0.4.0** です。画像読み込み、フレーム順編集、表示時間、ライブプレビュー、出力Canvas統一まで実装しています。GIF / WebP生成は後続マイルストーンで追加する予定で、未実装機能を完成済みとして表示しません。

## 現在できること

- JPEG / PNG / 静止WebPを複数読み込み
- ファイル選択、Drag & Drop、既存一覧への追加
- サムネイル、ファイル名、画像サイズ、メガピクセル、元ファイル容量の確認
- Animated WebPを検出できる場合は静止画として扱わず明示的に拒否
- 最大200枚、1ファイル50 MiB、合計500 MiB、1画像50 MPの安全ガード
- 一部の画像だけ失敗した場合、正常画像を残したまま失敗理由を分離表示
- 全画像消去前の確認
- 専用ハンドルによるマウス / タッチのドラッグ並べ替え
- ドラッグを使わなくても操作できる前へ / 後ろへボタン
- フレームの複製・削除
- 読み込みや順序変更を対象にしたUndo / Redoとキーボードショートカット
- ファイル名の自然順による昇順 / 降順ソート
- 各フレーム20〜10,000 ms・10 ms刻み、初期500 msの表示時間
- 100 / 200 / 500 / 1000 msプリセットまたは自由入力を全フレームへ一括適用
- 現在のフレーム列から合計再生時間を表示
- 実際の各フレーム表示時間で動くライブプレビュー
- 再生 / 一時停止、最初から、前のフレーム、次のフレーム
- 表示時間変更もUndo / Redo対象
- サイズ・縦横比が異なる画像を1つの出力Canvasへ統一
- 自動 / 長辺480 / 720 / 1080px / 元サイズ相当 / カスタム
- 画像全体を見せる「収める」とCanvasを埋める「切り抜く」
- 透明 / 白 / 黒 / カスタム色の背景
- 透明部分をチェッカーボードで確認
- プレビュー画像は必要なフレームだけ都度デコードして解放し、全フレームのフルRGBAを保持しない
- 日本語 / 英語を同じHTMLに内包し、言語切替はEN / JAの短い表示
- PC / スマートフォン対応のレスポンシブUI
- 実行時CDN、Analytics、Telemetry、外部APIなし

## 完成時の操作フロー

v1.0.0では次の流れを完成させます。

1. 画像を追加
2. フレームを並べ替え
3. 全体または各フレームの表示時間を設定
4. 出力サイズとFit / Fillを設定
5. Forward / Reverse / Ping-pongをプレビュー
6. Animated WebPまたはGIFを作成
7. 実際に生成されたファイルを確認して保存

段階的な実装内容は [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) を参照してください。

## プライバシー

読み込んだ画像はブラウザ内に留まります。Frame Animatorは選択ファイルをアップロードせず、変換用バックエンドも使用しません。

CSPは `connect-src 'none'` を使用し、Analytics、Telemetry、実行時CDN、外部フォント、外部APIを利用しません。

読み込んだ画像そのものをlocalStorageやIndexedDBへ自動保存しません。ページを閉じると作業中の画像セットは破棄されます。

## v0.4.0の対応入力

対応:

- JPEG / JPG
- PNG
- 静止WebP

未対応:

- Animated WebP
- GIF
- APNG
- 動画
- HEIC / HEIF
- AVIF
- SVG
- PSD
- PDF

## v0.4.0の上限

- 最大200枚
- 1ファイル50 MiB
- 読み込み済み元ファイル合計500 MiB
- 1画像50メガピクセル
- 1フレーム20〜10,000 ms、10 ms刻み
- 出力Canvasの幅・高さ16〜4096px

これらはアプリ側の安全ガードであり、すべてのブラウザや端末の絶対的な上限を示すものではありません。

## ブラウザ

主対象は現行Chrome / Edgeです。Firefox、Safari、iOS Safari、Android Chromeも開発中に確認対象とします。

最終的な単一HTML版は `file://` で直接開いて主要機能を利用できることを要件とします。

## 単一HTMLビルド

このリポジトリは現在のBrowser Kitty `htmlapps-template` のビルド契約に従います。

Windows PowerShell:

```powershell
./build-standalone.ps1
```

通常ビルドでは、読みやすい単一HTML、gzip自己展開版、テンプレート規約に従ったリポジトリ直下の配布用HTMLを生成します。

完了前には以下を実行します。

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-powershell-syntax.ps1
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

## 開発

製品仕様と受入条件は [APP_SPEC.md](APP_SPEC.md)、段階的な開発計画は [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) を正とします。

## ライセンス

MIT。詳細は [LICENSE](LICENSE) を参照してください。

第三者ライブラリの情報は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) に記載します。v0.4.0ではランタイム第三者依存を宣言していません。
