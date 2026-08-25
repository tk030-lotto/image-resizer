# Development Record — Image Resizer

- **Date**: 2026/08/25
- **Project**: Image Resizer (`c:\Users\tk030\Desktop\画像リサイズ`)
- **Product**: Browser-based Batch Image Resizing Tool with Long-Edge Constraint (TypeScript / Pure Client-Side)

---

## 1. Development Flow

| Phase | Content | Status |
|---|---|---|
| 1. Planning | Reviewed README.md / Specification.md, organized requirements, formulated implementation plan, and obtained user approval | ✅ |
| 2. Tech Selection | Confirmed as "TypeScript/JavaScript Web Tool" based on user direction | ✅ |
| 3. Environment | Verified Node v22.22.3 / npm 10.9.8 (satisfying Vite 7 requirements) | ✅ |
| 4. Implementation | Created configuration, HTML/CSS, core logic, I/O, UI, and test files | ✅ |
| 5. Testing | Executed unit tests with Vitest → 36/36 tests passed | ✅ 36/36 |
| 6. Build | Ran `tsc --noEmit` (typecheck) + `vite build` (single-file HTML generation) | ✅ Success |
| 7. Documentation | Created/updated README.md and RECORD.md to reflect implementation | ✅ |
| 8. Quality Audit | Executed comprehensive 9-stage quality audit → Overall Verdict: PASS | ✅ PASS |
| 9. Rule Sync | Synchronized common development rules across `.agents` / `.cursorrules` | ✅ |
| 10. GitHub Release | Created private repository (`image-resizer`) and pushed initial commit | ✅ |

---

## 2. Requirements Summary (from Specification.md)

- Originally drafted as a desktop application specification; implemented as a **browser-based Web tool** per user decision.
- Offline execution and zero server uploads are guaranteed by executing all image manipulation on the client side via the Canvas API.
- **MVP Scope**: Drag-and-drop input, multiple image batching, long-edge scaling, aspect-ratio preservation, no upscaling, preservation of original files, output to `resized/` subfolder, support for JPG/JPEG/PNG/WebP, processing result display.

---

## 3. Technology Stack & Rationale

| Category | Selection | Rationale |
|---|---|---|
| **Language** | TypeScript | Type safety and testability for dimension math and file-naming logic |
| **Build Tool** | Vite 7 + vite-plugin-singlefile | Inlines all scripts and styles into a standalone `dist/index.html` for zero-setup offline usage |
| **Framework** | None (Vanilla TypeScript) | Single-screen utility where heavy UI frameworks like React/Vue introduce unnecessary overhead |
| **Image Processing** | Browser Native APIs (`createImageBitmap`, Canvas 2D, `toBlob`) | Zero external dependencies; fast native hardware-accelerated processing |
| **ZIP Generation** | `fflate` (Store Level 0) | Fallback packaging for browsers lacking File System Access API support |
| **Testing** | Vitest | Fast test runner for pure-function core logic |

---

## 4. Repository Structure

```text
Image Resizer/
├── index.html              # UI structure (Stats Tool design layout)
├── package.json            # Scripts: dev / build / test / preview
├── tsconfig.json           # strict / noEmit / bundler resolution
├── vite.config.ts          # Single-file HTML inlining configuration
├── .gitignore              # node_modules / dist
├── dist/index.html         # Production standalone bundle (~44 kB)
├── src/
│   ├── main.ts             # Application controller (D&D, conversion pipeline, progress, results)
│   ├── style.css           # Premium slate-dark/clean-light theme & animations
│   ├── core/
│   │   ├── resize.ts       # calculateDimensions + Canvas resize pipeline (EXIF orientation support)
│   │   ├── filename.ts     # resolveFileName (Collision handling with image_001.jpg numbering)
│   │   └── format.ts       # detectFormat / resolveEncodeMime / supportsWebpEncode
│   ├── io/
│   │   ├── drop.ts         # Robust DataTransfer file extraction
│   │   └── writer.ts       # File System Access API writer / sanitizeFolderName / ZIP builder
│   └── ui/
│       └── result.ts       # Result metrics cards and detailed status rendering (XSS-safe textContent)
└── tests/
    ├── drop.test.ts        # DataTransfer extraction test cases
    ├── resize.test.ts      # Dimension calculation (landscape/portrait/square/no-upscale/clamping/errors)
    ├── filename.test.ts    # Name splitting, sequential numbering, case-insensitivity
    ├── format.test.ts      # Extension priority, MIME fallback, unsupported format handling
    └── writer.test.ts      # sanitizeFolderName edge cases
```

---

## 5. Key Implementation Highlights

1. **Dimension Math (`src/core/resize.ts`)**: `scale = longEdge / max(w,h)`. Returns original dimensions if target length is greater than or equal to current long edge (no upscaling). Rounded with a minimum 1px floor.
2. **EXIF Orientation Support (`src/core/resize.ts`)**: `createImageBitmap(blob, { imageOrientation: 'from-image' })` automatically accounts for mobile photo orientation.
3. **Collision-Safe File Naming (`src/core/filename.ts`)**: Uses lowercase normalized keys in the session registry. Windows filesystem-friendly case-insensitivity prevents accidental overwrites.
4. **Format Detection (`src/core/format.ts`)**: File extensions take precedence; MIME types serve as fallback.
5. **WebP Safe Fallback (`src/core/format.ts`)**: Probes browser support via `toDataURL('image/webp')` at runtime. Falls back gracefully to PNG on unsupported environments.
6. **Dual Output Pipeline (`src/io/writer.ts`)**:
   - Chrome / Edge: Directly writes files into a `resized/` subfolder using the File System Access API (`showDirectoryPicker`).
   - Firefox / Safari: Downloads a bundled `resized.zip` archive without server roundtrips.
7. **Resilient Error Handling (`src/main.ts`)**: Failed files (unsupported format, decode errors, permission issues) are logged individually without halting the entire batch queue.
8. **UI Responsiveness**: Yields execution back to the browser via `requestAnimationFrame` and `setTimeout` between image conversions to prevent UI freezes.
9. **Security**: All dynamic file names and paths are rendered strictly via `textContent` (zero `innerHTML` usage for XSS mitigation).

---

## 6. Test Suite & Coverage

```text
Test Files  5 passed (5)
Tests       36 passed (36)
Duration    ~1.8s
```

Coverage areas:
- `calculateDimensions`: Landscape, portrait, square, no-upscale rule, identical size, realistic camera resolutions (e.g. 4032x3024 at 1080), sub-pixel rounding, 9 RangeError validation cases.
- `resolveFileName`: Pass-through, `_001`/`_002` sequential numbering, extension variations, case-insensitive collision tracking, 3-digit zero-padding.
- `detectFormat`: 4 supported extensions across uppercase/lowercase, MIME complement, unsupported files (.gif, .bmp, .txt), dot-only strings.
- `sanitizeFolderName`: Standard names, whitespace trimming, Windows reserved characters replacement, single/double dots fallback.
- `filesFromDataTransfer`: Extraction from `dataTransfer.files`, fallback to `dataTransfer.items`, duplicate elimination, empty object safety.

---

## 7. Build Output

```text
vite v7.3.6 building client environment for production...
11 modules transformed.
[plugin vite:singlefile] Inlining: index-*.js / style-*.css
dist/index.html  44.44 kB │ gzip: 15.46 kB
built in 445ms   (tsc --noEmit typecheck passed)
```

The output is a 100% self-contained single HTML file that can be distributed and executed completely offline.

---

## 8. Command Reference

```bash
npm install      # Install dependencies
npm run dev      # Start development server (http://localhost:5173)
npm test         # Execute unit tests (Vitest)
npm run build    # Run typecheck and generate dist/index.html
npm run preview  # Preview production build
```

---

## 9. Revision History

### 2026/08/25: UI Redesign & Drag-and-Drop Hardening
- **Issues Addressed**: Resolved drag-and-drop registration failure and aligned UI aesthetics with the "Project Statistics Tool" design standard.
- **Modifications**:
  1. `src/io/drop.ts`: Enhanced file extraction to evaluate both `dataTransfer.files` and `dataTransfer.items` with deduplication.
  2. `src/main.ts`:
     - Added global drag overlay (`#drag-overlay`) to handle drops across the entire viewport while eliminating accidental browser file openings.
     - Introduced `dragCounter` state to prevent flicker caused by child element pointer boundaries.
     - Added thumbnail previews, file size formatting, format tags, item-level deletion, and queue clearing.
     - Linked preset buttons (1920/1280/1080/800) directly with the long-edge input field.
     - Integrated animated progress bar with percentage counter.
  3. `src/ui/result.ts`: Built statistical metric cards (Total, Success, Failed, Elapsed Time) and structured result lists.
  4. `src/style.css` / `index.html`: Applied slate-dark / clean-light design system with glassmorphism, accent glows, and smooth transitions.
  5. `tests/drop.test.ts`: Added unit tests for `filesFromDataTransfer` (36/36 tests passing).
- **Verification**: All unit tests passed, production bundle compiled cleanly, and visual/interactive verification confirmed via browser subagent.
