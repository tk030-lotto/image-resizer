# Image Resizer

シンプルで軽量な画像リサイズツールです。

画像をドラッグ＆ドロップし、指定した「長辺」のサイズに合わせて一括リサイズできます。

元画像は変更せず、リサイズした画像を指定フォルダへ保存します。

## 特徴

* 複数画像の一括リサイズ
* 長辺のサイズを指定するだけのシンプル操作
* 縦横比を自動維持
* 元画像を変更しない
* JPG / JPEG / PNG / WebP に対応
* オフラインで動作
* 外部サーバーへの画像アップロードなし
* OSS / MIT License

## 使い方

1. Image Resizerをブラウザで開きます。
2. リサイズしたい画像をドラッグ＆ドロップします。
3. 「長辺」に希望するサイズを入力します。
4. 出力先フォルダ名を確認します（既定は `resized` ）。
5. 「変換開始」を押し、出力先フォルダを選択します。

例えば「1280px」を指定した場合、

```text
4000 × 3000
        ↓
1280 × 960
```

縦長画像の場合は、

```text
3000 × 4000
        ↓
960 × 1280
```

のように、長辺を1280pxにして縦横比を維持します。

## 対応形式

### 入力

* JPG
* JPEG
* PNG
* WebP

### 出力

入力画像と同じ形式を基本とします。

## 出力

デフォルトでは、元画像とは別の `resized` フォルダに保存します。

```text
photos/
├── image01.jpg
├── image02.jpg
├── image03.jpg
└── resized/
    ├── image01.jpg
    ├── image02.jpg
    └── image03.jpg
```

元画像は変更されません。

## 設計方針

このツールは「多機能な画像編集ソフト」を目指していません。

目的は、

> **画像を指定サイズに小さくする**

という作業だけを簡単にすることです。

そのため、画像編集、フィルター、文字入れ、トリミングなどの機能は基本的に搭載しません。

## 今後の候補

必要性が確認できた場合のみ、以下の機能を検討します。

* JPEG品質指定
* 出力形式の変更
* 最大ファイルサイズ指定
* ドラッグ＆ドロップによるフォルダ対応

ただし、単機能ツールとしてのシンプルさを優先します。

## 開発

TypeScript + Vite による完全クライアントサイドのWebアプリケーションです。

### 必要環境

* Node.js 22.12+（または 20.19+）

### コマンド

```text
npm install      # 依存パッケージのインストール
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm test         # ユニットテスト（Vitest）
npm run build    # 型チェック + 単一HTML（dist/index.html）の生成
npm run preview  # ビルド結果のプレビュー
```

ビルドすると、JS / CSS をすべて内蔵した単一の `dist/index.html` が生成されます。このファイルをコピーしてブラウザで開くだけで、オフラインで利用できます。

### 構成

```text
src/
├── main.ts           # UI結線（ドラッグ＆ドロップ・変換フロー）
├── core/
│   ├── resize.ts     # サイズ計算・リサイズパイプライン
│   ├── filename.ts   # 同名ファイルの連番保存
│   └── format.ts     # 対応形式判定・エンコード可否チェック
├── io/
│   ├── drop.ts       # ドラッグ＆ドロップ処理
│   └── writer.ts     # フォルダ保存 / ZIPフォールバック
└── ui/
    └── result.ts     # 処理結果の表示
```

## ブラウザ対応

* Chrome / Edge：出力先フォルダを選択すると、その中の `resized` フォルダへ直接保存します（File System Access API）
* Firefox / Safari：`resized.zip` としてダウンロードします
* WebP 形式の保存に対応しないブラウザでは、WebP画像はPNGで保存されます（画面に案内を表示します）

※ 処理はすべてブラウザ内で完結し、画像が外部へ送信されることはありません。

## License

本プロジェクトは MIT License のもとで公開します(`LICENSE` ファイル参照)。

```text
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

> **公開前の注意**: `Copyright (c) 2026 [Your Name]` の `[Your Name]` を、README と `LICENSE` ファイルの両方でご自身の名前または組織名に書き換えてください。
