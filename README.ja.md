# Frame Animator

Frame Animatorは、複数のローカル画像からAnimated GIF / WebPを作るためのBrowser Kittyツールです。選択した画像を変換サーバーへアップロードせず、ブラウザ内で処理する構成を目指します。

> 現在の開発版は **v0.1.0** です。この段階では画像読み込みの基盤まで実装しています。並べ替え、表示時間、アニメーションプレビュー、GIF / WebP生成は後続マイルストーンで追加する予定で、未実装機能を完成済みとして表示しません。

## 現在できること

- JPEG / PNG / 静止WebPを複数読み込み
- ファイル選択、Drag & Drop、既存一覧への追加
- サムネイル、ファイル名、画像サイズ、メガピクセル、元ファイル容量の確認
- Animated WebPを検出できる場合は静止画として扱わず明示的に拒否
- 最大200枚、1ファイル50 MiB、合計500 MiB、1画像50 MPの安全ガード
- 一部の画像だけ失敗した場合、正常画像を残したまま失敗理由を分離表示
- 全画像消去前の確認
- 日本語 / 英語を同じHTMLに内包
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

## v0.1.0の対応入力

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

## v0.1.0の上限

- 最大200枚
- 1ファイル50 MiB
- 読み込み済み元ファイル合計500 MiB
- 1画像50メガピクセル

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

第三者ライブラリの情報は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) に記載します。v0.1.0ではランタイム第三者依存を宣言していません。
