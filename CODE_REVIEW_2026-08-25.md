# コードレビュー報告書 — Image Resizer

- **日付**: 2026/08/25
- **対象**: `c:\Users\tk030\Desktop\画像リサイズ`（src/ 全モジュール、tests/、index.html、設定ファイル一式）
- **基準文書**: `Specification.md`（仕様を絶対基準とし、推測でのバグ認定は行っていない）
- **分類**: 🔴 致命的欠陥 / 🟡 リスク・改善候補 / 🔵 提案（`.agents/agents/reviewer.md` の3段階基準に準拠）

---

## 検証結果（実行済み）

| 項目 | 結果 |
|---|---|
| `npx tsc --noEmit` | ✅ 合格 (exit 0) |
| `npm test` (vitest run) | ✅ 5ファイル / 23テストすべて合格 |
| 依存関係 | TypeScript 5.5 / Vite 7 / fflate のみ（Zero-Dependency 方針遵守） |
| Git 状態 | `index.html` に未コミットの変更あり（成果物との2行差分） |

---

## 🟢 総評（良い点）

- **XSS 安全設計**: `src/ui/result.ts` はファイル名含めすべて `textContent` 経由で描画。`innerHTML` は静的SVGのみ（`src/main.ts:185`）でユーザー入力を含まず、セキュリティ上の問題なし。
- **中核仕様の純粋関数化**: 長辺計算(`calculateDimensions`)・連番退避(`resolveFileName`)・形式判定(`detectFormat`)が分離されテスト完備。拡大禁止(§6)・丸め・極端値の境界テストも適切。
- **リソース解放**: `bitmap.close()` を finally で実施、プレビューURLの revoke も削除/クリア時に実施。
- **オフライン完結**(§14): 外部送信なし。ZIP代替は `level: 0` で軽量。
- **UI 明け渡し**: 変換ループ毎に `nextTick()`（rAF + setTimeout）で描画をブロックしない。

---

## 🔴 致命的欠陥（Critical）

### C-1. ビルドスクリプトがソース用 `index.html` を自己破壊し、開発パイプラインが切断されている

**根拠**: `package.json:10`

```json
"build": "tsc --noEmit && vite build && node -e \"require('fs').copyFileSync('dist/index.html', 'index.html')\""
```

初回ビルド時に成果物がソースHTMLを上書きする。現在のルート `index.html` は minify済みインラインバンドルであり、`<script type="module" src="/src/main.ts">` への参照が**消失済み**。

- コミット `21ea94a`「build: 直接配布用index.htmlを完全スタンドアロン内蔵型HTMLに置換」で置換が確定
- 原本（ソース版）は初期コミット `e2dcb45` に `<script type="module" src="/src/main.ts"></script>` 付きで現存

**影響**: 今後 `src/*.ts` を修正しても、`npm run dev` は古いバンドルを配信し、`npm run build` は**古いインラインコードを焼き直すだけ**で新ソースを取り込まない。tsc・テストは通るため、**配布物が静かに陳腐化する**極めて危険な状態。

**修正案**:

1. ソース版を復元する（本文マークアップは現行物を流用し、head のインライン style/script を置換）:

```html
<!-- index.html の </head> 直前に戻すべき1行 -->
<script type="module" src="/src/main.ts"></script>
<!-- インライン化された <style>〜</style> と <script type="module" crossorigin>〜</script> は削除 -->
```

2. 上書きコピーを廃止し、配布物は `dist/` に限定:

```json
// package.json
"build": "tsc --noEmit && vite build"
```

※ 配布用シングルファイルは引き続き `dist/index.html` に生成されるため、`README.md`・`ツール起動.bat` の参照先を `dist/index.html` に合わせること。

### C-2. 仕様§11違反: FSAA保存時に「ディスク上の既存ファイル」との衝突を検査していない

**根拠**: `src/core/filename.ts:27` の `resolveFileName` はセッション内の `usedNames` とのみ照合。`src/io/writer.ts` の `getFileHandle(name, {create:true})` + `createWritable()` は既存ファイルを truncate して**無条件上書き**する。

仕様 §11「出力先に同名ファイルが存在する場合、既存ファイルを無条件で上書きしない」に明確に違反し、**前回実行で作成した出力ファイルを黙って破壊**する（File System Access API 経路のみ。ZIP経路では発生しない）。

**修正例**（`src/io/writer.ts` に追加し、`main.ts` の `convert()` 内 `ensureSubDirectory` 直後に呼び出す）:

```ts
/** 既存ファイル名を列挙して衝突判定セットに取り込む(File System Access API 対応時)。 */
export async function seedExistingNames(
  dir: OutputDirectoryHandle,
  used: Set<string>,
): Promise<void> {
  const iterable = (dir as unknown as {
    values?: () => AsyncIterable<{ name: string }>;
  }).values;
  if (typeof iterable !== 'function') return; // 未対応環境はスキップ
  try {
    for await (const handle of iterable.call(dir)) {
      used.add(handle.name.toLowerCase());
    }
  } catch {
    /* 列挙失敗時は現状動作を維持 */
  }
}
```

```ts
// main.ts convert() 内
outDir = await ensureSubDirectory(baseDir, folderName);
await seedExistingNames(outDir, usedNames); // ← 追加(usedNames宣言より後の位置へ調整)
destinationLabel = `${baseDir.name}\\${folderName}\\`;
```

※ `usedNames` の宣言位置（`running = true` 後）より前に移動する必要がある点に注意。

### C-3. 変換実行中のキュー操作でループ不整合（バグ）

**根拠**: `src/main.ts:258` の `for (let i = 0; i < queue.length; i += 1)` に対し、変換実行中も削除ボタン(`file-remove-btn`)・全クリア(`clear-all-btn`)が**無効化されていない**（disabled になるのは `startButton` のみ）。変換中に項目を削除すると `splice` でインデックスがずれ、**未処理ファイルのスキップや進捗表示の崩れ**が発生。全クリアでは空結果のまま「変換完了」が表示される。

**修正例**:

```ts
// convert(): ループ対象を実行開始時のスナップショットに固定
for (const item of [...queue]) { /* ... */ }

// 実行中は削除系UIも無効化
clearAllBtn.disabled = true;   // convert() 冒頭
// ...finally 節で clearAllBtn.disabled = false;
// 個別削除ボタンも running 中は disabled 推奨
```

（スナップショット化だけで論理破綻は防止できるが、UI面での無効化と併用するのが堅牢。）

---

## 🟡 リスク・改善候補（Warning）

| # | 箇所 | 内容 |
|---|---|---|
| W-1 | `src/io/writer.ts:39-50` | `pickTargetDirectory` が全例外を握りつぶすため、**権限拒否(NotAllowedError)** も「キャンセルされました」と誤表示される。`describeError`(`main.ts:212`) の NotAllowedError 分岐がピッカー段階では到達不能（死んだコード）。`AbortError` のみ null を返し、それ以外は再スローすべき |
| W-2 | `src/io/writer.ts:61-70` | `writeFile` が `write()` 失敗時に `close()` を呼ばない（ライターハンドルリークの可能性）。try/finally 化を推奨 |
| W-3 | `src/io/writer.ts:73-76` | `sanitizeFolderName` が**末尾ドット・末尾空白・制御文字を除去しない**。Windows では `"foo."` は無効なフォルダ名で `getDirectoryHandle` が失敗する。`.replace(/[.\s]+$/, '')` の追加を推奨 |
| W-4 | `src/core/resize.ts:41-44` | EXIF 回転補正 `imageOrientation:'from-image'` は非対応ブラウザで無視され、**縦写真が横長として縮小計算**される。フォールバックなし。また TS 5.5 の lib.dom は `'from-image'` を型定義済みのため、二重キャスト (`as unknown as ImageBitmapOptions`) は不要の可能性 |
| W-5 | `src/io/writer.ts:84-91` | ZIP代替経路が全画像を `Uint8Array` として一括メモリ保持。数百枚規模でメモリ圧迫（§14 パフォーマンス要件への懸念）。件数多い場合は分割ダウンロードや警告表示の検討 |
| W-6 | `Specification.md` | **仕様ドリフト**: §9「入力画像と同じフォルダ内に resized を作成」に対し、実装は任意フォルダ選択＋ZIP代替。§13 の「出力フォルダを開く」ボタンも未実装。README は実装側に整合しているため、Specification.md 側の更新が必要 |

---

## 🔵 提案（Note/Suggestion)

1. **`src/main.ts:243`**: `destinationLabel` の区切りが `\` 固定。macOS/Linux Chrome では不自然な表示になる。
2. **`src/core/resize.ts:67`**: JPEG/WebP 再エンコード品質 `0.92` 固定が UI・仕様に非明示（画質劣化の事実が利用者から見えない）。
3. **`src/main.ts:28-48`**: DOM 取得の一斉 `as HTMLElement` キャストに対し `headerSelectBtn` だけ null チェックがあり基準が不一貫。要素欠損時の TypeError が分かりにくい。
4. **`src/core/format.ts`**: 判定は拡張子/MIME 信頼のみ（マジックナンバー未検証）。破損ファイルは `createImageBitmap` で失敗し §12 の継続処理要件は満たすため許容範囲。設計意図の明記を推奨。
5. **テストカバレッジ**: 純粋関数のみカバー。`resizeToBlob` / `writeFile` / `buildZip` / 描画系が未テスト（`happy-dom` 環境の追加で拡張可能）。
6. **`src/main.ts:54-60`**: `formatBytes` が NaN・負数を考慮せず（`file.size` は必ず 0 以上のため実害小）。
7. **ドキュメント構成**: `knowledge/protocol.md`・`knowledge/quality-audit.md` がワークスペースに存在せず、SKILLS.md／.clinerules の参照が切れている。
8. **ルールファイル重複**: `.clinerules` / `.cursorrules` / `.clauderules` / `.github/copilot-instructions.md` が同一内容 (383B)。単一ソース化を推奨。

---

## まとめ

ロジック品質・セキュリティ設計・テスト水準は高い水準にある。ただし、

- **C-1（ビルドによるソース破壊）**: 放置すると今後のすべての修正が配布物へ反映されなくなる構造的欠陥
- **C-2（既存ファイル上書き）**: 仕様 §11 への直接違反
- **C-3（変換中キュー操作）**: 操作次第で発生する実バグ

の3件は修正を強く推奨する。

### 推奨対応順序

1. C-1: `index.html` 復元＋ build スクリプト改修（他の修正作業の前提条件）
2. C-2: 既存ファイル名シード追加
3. C-3: スナップショット化＋UI無効化
4. W-1〜W-4: 保存経路の堅牢化
5. Specification.md の実態合わせ更新（W-6）
