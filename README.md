# Image Resizer

長辺指定で画像を一括リサイズする、高速・軽量なWebアプリケーションです。
ブラウザ内で完結して動作するため、画像が外部サーバーへ送信されることは一切ありません。

## 特徴

* **一括リサイズ**: 複数画像をまとめてドラッグ＆ドロップまたはファイル選択で処理
* **長辺指定**: 長辺（px）を指定するだけで縦横比を自動維持してリサイズ
* **拡大防止**: 元画像の長辺が指定値より小さい場合は画質劣化を防ぐため拡大しない
* **元画像保護**: 元ファイルは変更せず、別名・別フォルダ（`resized/`）へ保存
* **同名保護**: 同名ファイルが存在する場合は `image_001.jpg` 形式の連番で自動退避
* **対応形式**: JPG / JPEG / PNG / WebP（WebP非対応環境ではPNGへ代替）
* **完全オフライン**: サーバー送信なし・通信環境不要・高速処理
* **洗練されたUI**: プロジェクト統計ツール準拠のスレートダーク/ライト対応モダンデザイン

## 使い方

1. `dist/index.html` をブラウザで開くか、ローカル開発サーバー（`npm run dev`）を起動します。
2. 画面の中央に画像をドラッグ＆ドロップするか、「ファイルを選択」をクリックして画像を追加します。
3. リサイズしたい「長辺サイズ（px）」を入力するか、クイックプリセット（1920/1280/1080/800）をクリックします。
4. 出力フォルダ名（初期値: `resized`）を確認し、「変換開始」ボタンをクリックします。
5. Chrome / Edge では保存先フォルダを選択すると直接ファイルが書き込まれます。その他のブラウザでは `resized.zip` として即時ダウンロードされます。

## 開発環境

- Node.js 22.12+ (または 20.19+)
- TypeScript 5.5+
- Vite 7 + vite-plugin-singlefile
- Vitest

### コマンド一覧

```bash
npm install      # 依存パッケージのインストール
npm run dev      # 開発サーバーの起動 (http://localhost:5173)
npm test         # 単体テストの実行 (Vitest)
npm run build    # 型チェック + 単一HTMLファイル (dist/index.html) の生成
npm run preview  # 本番ビルド成果物のプレビュー (http://localhost:4173)
```

## プロジェクト構成

```text
画像リサイズ/
├── index.html              # UI構造 (ネイティブ label 連携)
├── package.json            # 依存関係・スクリプト定義
├── tsconfig.json           # TypeScript コンパイル設定
├── vite.config.ts          # 単一HTMLバンドル設定
├── dist/index.html         # ビルド成果物 (完全内蔵型スタンドアロンHTML)
├── src/
│   ├── main.ts             # アプリケーション結線・プレビュー・進捗管理
│   ├── style.css           # 統計ツール準拠デザインシステム
│   ├── core/
│   │   ├── resize.ts       # 長辺計算・Canvasリサイズ・EXIF回転補正
│   │   ├── filename.ts     # 同名連番ファイル名生成
│   │   └── format.ts       # 形式判定・WebPフォールバック
│   ├── io/
│   │   ├── drop.ts         # DataTransfer / FileList 抽出ロジック
│   │   └── writer.ts       # File System Access API / ZIP生成・ダウンロード
│   └── ui/
│       └── result.ts       # 統計メトリクスカード & 結果リスト描画
└── tests/
    ├── drop.test.ts        # ファイル抽出テスト
    ├── resize.test.ts      # 寸法計算・拡大抑止テスト
    ├── filename.test.ts    # 連番生成・大小文字判定テスト
    ├── format.test.ts      # フォーマット判定テスト
    └── writer.test.ts      # フォルダ名サニタイズテスト
```

## License

MIT License

Copyright (c) 2026 tk030

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
