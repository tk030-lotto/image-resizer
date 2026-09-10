# Development Record — Image Resizer

- **Date**: 2026/08/25
- **Project**: Image Resizer (`c:\Users\tk030\Desktop\画像リサイズ`)
- **Product**: Browser-based Batch Image Resizing Tool with Long-Edge Constraint (TypeScript / Pure Client-Side)

---

## 1. Development Flow & Code Review Fixes

| Phase | Content | Status |
|---|---|---|
| 1. Reset & Rebuild | Clean reset of temporary assets and complete clean-slate re-architecture | ✅ |
| 2. Specification & Doc | Reconstructed Specification.md, README.md (with MIT license & usage guide) | ✅ |
| 3. UI System | Designed Project Statistics Tool deep-dark theme (`#0c0d0e`), header card, drop card, status bar | ✅ |
| 4. Core Pipeline | Implemented aspect-ratio preservation, no upscaling, collision numbering, FSAA & ZIP output | ✅ |
| 5. Code Review Audit | Evaluated Cline's code review report (C-1, C-2, C-3, W-1〜W-3, W-6) | ✅ |
| 6. Review Remediation | Restored source `index.html`, removed destructive build copy, added `seedExistingNames` for existing file protection, locked UI during processing, handled AbortError re-throw & try/finally writable close | ✅ Fixed |
| 7. Unit Testing | Executed Vitest unit test suite → 25/25 tests passing (added existing file seeding & trailing dot sanitization) | ✅ 25/25 |
| 8. Production Build | Executed `tsc --noEmit` + `vite build` → Standalone single HTML `dist/index.html` (44.91 kB) | ✅ Success |
| 9. Batch Launch | Generated pure Shift-JIS CP932 `ツール起動.bat` opening `dist/index.html` with interactive wait prompt | ✅ Ready |

---

## 2. Requirements Summary

- **Pure Client-Side**: No image data is sent to external servers; all processing is executed locally via the browser Canvas API.
- **Aspect Ratio & Scale Control**: Calculates target dimensions preserving aspect ratio; never upscales images smaller than target.
- **Reliable File Input**: Supports drag-and-drop across viewport/dropzone, and native click-to-browse file dialogs via `<label for="file-input">`.
- **Output Flexibility**: Direct folder saving via File System Access API (Chrome/Edge) or ZIP download fallback (Firefox/Safari).
- **Existing File Protection**: Seeds existing file names from the output directory before saving to prevent overwriting existing files.

---

## 3. Tech Stack & Directory Structure

```text
Image Resizer/
├── index.html              # Source UI entry point (linking /src/main.ts)
├── package.json            # Vite 7 / TypeScript 5.5 / fflate / Vitest
├── tsconfig.json           # Bundler resolution & strict type checking
├── vite.config.ts          # Single-file HTML inlining configuration
├── dist/index.html         # Standalone production build (~44.9 kB)
├── ツール起動.bat           # Shift-JIS batch file launching dist/index.html
├── src/
│   ├── main.ts             # Application controller (D&D, preview, progress, lock, convert)
│   ├── style.css           # Project Statistics Tool deep-dark design system
│   ├── core/
│   │   ├── resize.ts       # calculateDimensions, Canvas resize, EXIF rotation handling
│   │   ├── filename.ts     # Collision-safe sequential numbering (image_001.jpg)
│   │   └── format.ts       # Format detection & WebP runtime probe / fallback
│   ├── io/
│   │   ├── drop.ts         # Robust DataTransfer / FileList extraction
│   │   └── writer.ts       # File System Access API (with seedExistingNames) & ZIP bundling
│   └── ui/
│       └── result.ts       # Statistical metric cards & detailed item status list
└── tests/
    ├── drop.test.ts        # DataTransfer extraction tests
    ├── resize.test.ts      # Dimension calculation & error validation tests
    ├── filename.test.ts    # Sequential numbering & case-insensitive tests
    ├── format.test.ts      # Format detection & MIME fallback tests
    └── writer.test.ts      # Folder name sanitization & existing file seeding tests
```

---

## 4. Test & Verification Results

```text
Test Files  5 passed (5)
Tests       25 passed (25)
Duration    ~1.8s
```

All core pure functions (scaling logic, format sniffing, file collision resolution, folder sanitization, existing file seeding, and data extraction) are fully tested and passing.

---

## 5. Build Output

```text
dist/index.html  44.91 kB │ gzip: 15.31 kB
✓ built in 467ms (tsc --noEmit typecheck passed)
```

The production output `dist/index.html` is fully self-contained with inlined JavaScript and CSS, ready for zero-dependency offline usage.

---

## 6. GitHub Pages Deployment & Public Release (2026/09/10)

- **変更・実装内容**:
  - GitHub CLI によるリポジトリ可視性の変更（`private` → `public`）。
  - GitHub Pages のビルドタイプ有効化（`workflow`）。
  - `vite.config.ts` への相対ベースパス（`base: './'`）の追加。
  - `.github/workflows/deploy.yml` の作成（Node 20 環境での `npm ci` → `npm run build` → Pages 自動デプロイ）。
  - `README.md` への公開 URL（https://tk030-lotto.github.io/image-resizer/）の明記。
- **技術的決定・背景**:
  - 本ツールはサーバーレスかつ完全クライアントサイド動作（Canvas API + fflate）であるため、GitHub Pages による無料静的ホスティングが最適であると判断。
  - リポジトリにビルド成果物（`dist/`）を直接コミットするのではなく、GitHub Actions で自動ビルド・デプロイを行う標準的な CI/CD パイプラインを採用し、ソースコードの純粋性とデプロイの自動化を両立。
- **📝 記事ネタ・発信知見**:
  - **提供価値**: サーバー通信一切なし・画像漏洩リスクゼロの単機能画像リサイズWebアプリを、Vite + vite-plugin-singlefile + GitHub Actions を用いて完全無料で GitHub Pages にホスティング・公開する実践手順。
  - **試行錯誤・ブレイクスルー**: サブディレクトリ配信（`/<repo-name>/`）における `base: './'` の重要性と、`gh api` コマンドによる GitHub Pages の CUI 初期化手順。
  - **タイトル案**: 「サーバー代ゼロ・画像漏洩ゼロ！ブラウザ完結型画像一括リサイズツールをGitHub Pagesで全自動公開した話」

