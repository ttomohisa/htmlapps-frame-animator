# Frame Animator

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/deploy-pages.yml)
[![Validate standalone HTML](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/build-standalone.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/build-standalone.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-16624F)](https://ttomohisa.github.io/htmlapps-frame-animator/)

[English README](README.md)

Frame Animatorは、JPEG・PNG・静止WebP画像を並べ、表示時間を調整して**動くGIFやAnimated WebP**を作成するブラウザツールです。画像を変換サーバーにアップロードせず、追加から書き出しまで端末内で処理します。

完成済みの単一HTMLを使うだけなら、登録やインストールは不要です。

## 🚀 デモ

### [GitHub PagesでFrame Animatorを開く](https://ttomohisa.github.io/htmlapps-frame-animator/)

GitHub Pagesから最初のHTMLを読み込んだ後は、画像の読み込み・フレーム編集・プレビュー・GIF/WebP作成・保存をブラウザ内で処理します。選択した画像をアプリがサーバーへアップロードすることはありません。

[![Frame Animatorの画面](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-frame-animator/)

GitHub Pagesは`main`ブランチから公開しています。新しいバージョンは、PRのマージ後に自動のPagesデプロイが成功すると公開サイトへ反映されます。

## すぐに使う

### Webで使う

[GitHub PagesでFrame Animatorを開く](https://ttomohisa.github.io/htmlapps-frame-animator/)だけで使えます。登録やインストールは不要です。


### 単一HTMLを開く

1. このリポジトリの [frame-animator.html](frame-animator.html) をダウンロードします。
2. ChromeやEdgeなどの現行ブラウザで開きます（`file://` から直接開けます）。
3. 画像を追加してアニメーションを作成します。ダウンロードしたHTMLはオフラインでも使用できます。

### オフライン版を自分でビルドする（上級者向け）

Windowsでリポジトリをダウンロードまたはクローンし、次を実行します。

```powershell
./build-standalone.ps1
```

初回ビルド時に、固定バージョンのWebPエンコーダを取得して必要なJavaScript/WASMをHTMLへ内包します。生成された `dist/index.html` は、その後ネット接続なしで直接開けます。ビルドにはWindows PowerShellと `tar.exe` を使用します。Node.jsとPlaywrightは任意のブラウザ自動テストでのみ使います。

このリポジトリではGitHub Pagesが有効になっており、`main`ブランチからの公開ワークフローを使用しています。公開版は上記デモリンクで開けます。単一HTML版はオフライン利用にも対応します。

## スクリーンショット

| PC（日本語） | PC（英語） |
| --- | --- |
| [![日本語のFrame Animator](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-frame-animator/) | [![英語のFrame Animator](assets/screenshot-en.png)](https://ttomohisa.github.io/htmlapps-frame-animator/) |

[![スマートフォンのFrame Animator](assets/screenshot-mobile.png)](https://ttomohisa.github.io/htmlapps-frame-animator/)

## 主な機能

- ダイアログ表示中は背景のスクロールが止まり、閉じると元どおりスクロールできます。
- **画像を追加して並べ替える** — 複数選択、ドラッグ＆ドロップ、クリップボード貼り付けに対応。カードのドラッグ、前へ・後ろへボタン、ファイル名順で並び替えられます。
- **表示時間を調整する** — 全フレームへの一括設定や、各画像の20〜10,000msの個別設定に対応。**0.5× ゆっくり／2× はやく**で個別の時間をまとめて拡大・縮小できます。順序や時間の変更は元に戻す・やり直すができます。
- **再生して確かめる** — 再生・一時停止・コマ送りに加え、Forward（順方向）、Reverse（逆方向）、Ping-pong（往復）を選択。無限・1回・回数指定の再生に対応します。
- **画像の大きさをそろえる** — Canvasサイズを指定し、余白を残す「収める」／切り抜く「切り抜く」、透明・白・黒・任意色の背景を選べます。
- **GIFかWebPを選んで書き出す** — GIFは色数とDithering、WebPは品質・Lossless・Effortを調整できます。進捗表示とキャンセルにも対応します。
- **保存前に確認する** — 生成されたGIF/WebPそのものをプレビュー。サイズ・フレーム数・再生時間・容量を確認し、ファイル名を指定して保存できます。
- **スマホでも端末内処理** — 下部固定の「フレーム／プレビュー／書き出し」切替、日本語／英語UI、外部アップロードなし。

## 使い方

1. JPEG・PNG・静止WebPを複数選択して追加します。ドロップや画像の貼り付けでも追加できます。
2. カードのハンドルをドラッグして順番を変更します。前へ・後ろへボタン、複製・削除も使えます。
3. 全体の表示時間を一括設定するか、各カードの表示時間を調整します。「0.5× ゆっくり」は各時間を2倍、「2× はやく」は半分にします（10ms刻み・20〜10,000ms）。丸めや上限・下限の調整があっても、「元に戻す」で直前の値を正確に復元できます。
4. 出力Canvasのサイズ、画像の配置（収める／切り抜く）、背景を設定します。
5. プレビューを再生し、順方向・逆方向・往復とループ回数を決めます。
6. **GIF**または**Animated WebP**を選び、形式別の設定を確認して作成します。
7. 実際に生成したファイルを結果欄で確認し、ファイル名を変更して保存します。

スマートフォンでは画面下部の**「フレーム／プレビュー／書き出し」**で作業画面を切り替えます。カードのドラッグ用ハンドルは通常の縦スクロールと区別しています。

### 再生と形式の注意点

Animated WebPは**MP4動画ではなく、動く画像**です。一部の画像ビューアーでは最初の1コマしか表示されません。保存したWebPが動かない場合は、対応ブラウザで開いて確認してください。

再生方向やループ回数はGIF/WebPで共通です。エンコード品質などの設定は形式ごとに異なります。出力に影響する設定を変更した場合は再生成が必要です。書き出しに失敗しても、読み込んだ画像を残したまま再試行できます。

### キーボード操作

| キー | 操作 |
| --- | --- |
| `Ctrl` / `⌘` + `Z` | 元に戻す |
| `Ctrl` / `⌘` + `Shift` + `Z` | やり直す |
| `Ctrl` / `⌘` + `Y` | やり直す |

ドラッグができない場合も、カードの前へ・後ろへボタンで並び替えられます。

## 対応形式と上限

**読み込み対応：** JPEG/JPG、PNG、静止WebP。GIF・Animated WebP・APNG・HEIC/HEIF・AVIF・SVG・動画・PDF・PSDの読み込みには対応しません。書き出しはAnimated GIF（`.gif`）とAnimated WebP（`.webp`）です。MP4には書き出しません。

| 項目 | アプリ側の上限 |
| --- | --- |
| フレーム数 | 200枚 |
| 画像ファイル | 1枚50 MiB |
| 読み込み済みファイル合計 | 500 MiB |
| 1枚の画像 | 50メガピクセル |
| 表示時間 | 20〜10,000ms、10ms刻み |
| 出力Canvas | 幅・高さそれぞれ16〜4096px |
| 回数指定ループ | 2〜100回（ほかに1回／無限） |

これはアプリが設けた安全上限です。端末メモリやブラウザによっては、上限より小さい処理でも失敗する場合があります。読み込めない画像の理由は、正常に読み込めた画像とは分けて表示します。

APNGとAnimated WebPは先頭の静止画として取り込まず、対象外として表示します。WebPの拡張子や種類がPNG/JPEGに変更されていても、内容から判定します。読み込めないファイルだけを追加した場合は、元のフレーム・表示時間・作成済み出力を維持します。

## GitHub Pagesで公開する

このリポジトリの[「Deploy standalone app to GitHub Pages」ワークフロー](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/deploy-pages.yml)は、`main`へのプッシュ時と手動実行時に動きます。

1. **Settings → Pages → Build and deployment** で公開ソースを **GitHub Actions** に設定します。
2. PRをレビューして`main`にマージするか、**Actions**からデプロイワークフローを手動実行します。
3. ワークフローが必要なHTMLを生成・検証し、`dist`をGitHub Pagesへ公開します。公開先は[Frame AnimatorのGitHub Pages](https://ttomohisa.github.io/htmlapps-frame-animator/)です。

PR PreviewとGitHub Pagesの公開サイトは別です。公開版の更新は、`main`からのデプロイが成功した後に行われます。

## 開発とビルド

```text
.
├─ src/index.template.html           # アプリ本体と日英UI
├─ app.config.json                   # アプリ情報とバージョン
├─ dependencies.json                 # 内包する依存の指定
├─ dependencies.lock.json            # 依存ファイルのハッシュ
├─ build-standalone.ps1              # Windows用ビルド
├─ frame-animator.html               # リポジトリ直下の単一HTML
├─ scripts/rc-browser-test.mjs       # Chromium回帰テスト
├─ assets/                            # faviconとスクリーンショット
└─ dist/                              # ビルドで生成
   ├─ index.html
   └─ index.self-extract.html
```

Windowsでビルドとリポジトリ構成を検証します。

```powershell
./scripts/check-repository.ps1
```

ブラウザの回帰テストはPlaywright/Chromiumを使い、GitHub Actionsでも実行します。詳しい仕様・実装計画・開発方法は [APP_SPEC.md](APP_SPEC.md)、[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)、[CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。

開発用の時間・読み込みテストは `node --test scripts/timing-import-test.mjs` で実行できます。

## プライバシーとオフライン動作

- 追加した画像の読み込み・変換・保存は**ブラウザ内で実行**します。アプリから画像の内容をアップロードしません。
- WebPエンコーダなど必要な実行時資産は生成HTMLに内包します。CSPは `connect-src 'none'` を含み、実行時CDN、Analytics、Telemetry、変換APIを使用しません。
- 画像そのものをlocalStorageやIndexedDBへ自動保存しません。ページの再読み込み・終了時には作業画像を破棄します。言語設定などは端末に保存されることがあります。
- Web公開版では最初のHTML読み込みに通信が必要です。ネット接続を使わず利用したい場合は、単一HTMLを端末内で開いてください。

## 対応ブラウザと制限事項

主な検証対象は現行のChromeとEdgeです。Firefox、Safari、iOS Safari、Android Chromeはベストエフォートです。特に大きなWASM変換ではブラウザや端末によって利用可否・性能に差があります。

動画の読み込み、画像の部分編集、トランジション・音声の追加、MP4出力には対応しません。高解像度画像や多数のフレームでは、順次処理する設計でもメモリ不足になることがあります。

## 依存ライブラリ

| 実行時の依存 | 固定バージョン | ライセンス | 用途 |
| --- | --- | --- | --- |
| [@jsquash/webp](https://github.com/jamsinclair/jSquash) / libwebp | 1.5.0 | Apache-2.0（ラッパー）、libwebp再配布条件 | Animated WebPを端末内で生成 |

GIFのエンコーダとカードのドラッグ処理はアプリ内で実装しています。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。

## 開発への参加

不具合や改善案はGitHub Issuesで受け付けます。変更への参加方法は [CONTRIBUTING.md](CONTRIBUTING.md)、脆弱性の報告方法は [SECURITY.md](SECURITY.md) を確認してください。

自己展開版も通常版と同じく、埋め込みWebPエンコーダーを端末内で使用します。外部通信は許可しません。

## ライセンス

Copyright © 2026 ttomohisa。[MIT License](LICENSE)。
