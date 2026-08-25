# Development Record — Image Resizer

- **Date**: 2026/08/25
- **Project**: Image Resizer (`c:\Users\tk030\Desktop\画像リサイズ`)
- **Product**: Browser-based Batch Image Resizing Tool with Long-Edge Constraint (TypeScript / Pure Client-Side)

---

## 1. Development Flow

| Phase | Content | Status |
|---|---|---|
| 1. Reset & Rebuild | Clean reset of temporary assets and complete clean-slate re-architecture | ✅ |
| 2. Specification & Doc | Reconstructed Specification.md, README.md (with MIT license & usage guide) | ✅ |
| 3. Architecture | Implemented native `<label>` binding for 100% reliable file selection dialogs & robust DataTransfer extraction | ✅ |
| 4. UI System | Designed Project Statistics Tool slate-dark / clean-light theme with glassmorphism | ✅ |
| 5. Core Pipeline | Implemented aspect-ratio preservation, no upscaling, collision numbering, FSAA & ZIP output | ✅ |
| 6. Unit Testing | Executed Vitest unit test suite → 23/23 tests passing | ✅ 23/23 |
| 7. Production Build | Executed `tsc --noEmit` + `vite build` → Standalone single HTML `dist/index.html` (44.79 kB) | ✅ Success |
| 8. Browser Verification | Verified UI layout, native file picker trigger, and interactive presets via browser subagent | ✅ PASS |

---

## 2. Requirements Summary

- **Pure Client-Side**: No image data is sent to external servers; all processing is executed locally via the browser Canvas API.
- **Aspect Ratio & Scale Control**: Calculates target dimensions preserving aspect ratio; never upscales images smaller than target.
- **Reliable File Input**: Supports drag-and-drop across viewport/dropzone, and native click-to-browse file dialogs via `<label for="file-input">`.
- **Output Flexibility**: Direct folder saving via File System Access API (Chrome/Edge) or ZIP download fallback (Firefox/Safari).

---

## 3. Tech Stack & Directory Structure

```text
Image Resizer/
├── index.html              # UI entry point with native label file selection
├── package.json            # Vite 7 / TypeScript 5.5 / fflate / Vitest
├── tsconfig.json           # Bundler resolution & strict type checking
├── vite.config.ts          # Single-file HTML inlining configuration
├── dist/index.html         # Standalone production build (~44.8 kB)
├── src/
│   ├── main.ts             # Application controller (D&D, preview, progress, convert)
│   ├── style.css           # Project Statistics Tool slate-dark design system
│   ├── core/
│   │   ├── resize.ts       # calculateDimensions, Canvas resize, EXIF rotation handling
│   │   ├── filename.ts     # Collision-safe sequential numbering (image_001.jpg)
│   │   └── format.ts       # Format detection & WebP runtime probe / fallback
│   ├── io/
│   │   ├── drop.ts         # Robust DataTransfer / FileList extraction
│   │   └── writer.ts       # File System Access API & ZIP bundling
│   └── ui/
│       └── result.ts       # Statistical metric cards & detailed item status list
└── tests/
    ├── drop.test.ts        # DataTransfer extraction tests
    ├── resize.test.ts      # Dimension calculation & error validation tests
    ├── filename.test.ts    # Sequential numbering & case-insensitive tests
    ├── format.test.ts      # Format detection & MIME fallback tests
    └── writer.test.ts      # Folder name sanitization tests
```

---

## 4. Test & Verification Results

```text
Test Files  5 passed (5)
Tests       23 passed (23)
Duration    ~2.3s
```

All core pure functions (scaling logic, format sniffing, file collision resolution, folder sanitization, and data extraction) are fully tested and passing.

---

## 5. Build Output

```text
dist/index.html  44.79 kB │ gzip: 15.51 kB
✓ built in 561ms (tsc --noEmit typecheck passed)
```

The production output `dist/index.html` is fully self-contained with inlined JavaScript and CSS, ready for zero-dependency offline usage.
