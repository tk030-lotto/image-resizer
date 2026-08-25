import './style.css';
import { detectFormat, resolveEncodeMime, supportsWebpEncode, type ImageFormat } from './core/format';
import { resolveFileName, splitFileName } from './core/filename';
import { resizeToBlob } from './core/resize';
import { filesFromDataTransfer } from './io/drop';
import {
  buildZip,
  downloadBlob,
  ensureSubDirectory,
  pickTargetDirectory,
  sanitizeFolderName,
  seedExistingNames,
  supportsDirectoryPicker,
  writeFile,
  type OutputDirectoryHandle,
  type ZipEntry,
} from './io/writer';
import { renderResult, type ProcessResult } from './ui/result';

interface QueueItem {
  id: string;
  file: File;
  format: ImageFormat | null;
  previewUrl?: string;
  formattedSize: string;
}

// DOM 要素
const dragOverlay = document.getElementById('drag-overlay') as HTMLElement;
const dropZone = document.getElementById('drop-zone') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileListCard = document.getElementById('file-list-card') as HTMLElement;
const fileList = document.getElementById('file-list') as HTMLElement;
const queueCountBadge = document.getElementById('queue-count-badge') as HTMLElement;
const clearAllBtn = document.getElementById('clear-all-btn') as HTMLButtonElement;

const form = document.getElementById('convert-form') as HTMLFormElement;
const longEdgeInput = document.getElementById('long-edge') as HTMLInputElement;
const outputNameInput = document.getElementById('output-name') as HTMLInputElement;
const presetButtons = document.querySelectorAll<HTMLButtonElement>('.preset-btn');
const startButton = document.getElementById('start-button') as HTMLButtonElement;

const progressWrapper = document.getElementById('progress-wrapper') as HTMLElement;
const progressStatusText = document.getElementById('progress-status-text') as HTMLElement;
const progressPercentText = document.getElementById('progress-percent-text') as HTMLElement;
const progressBarFill = document.getElementById('progress-bar-fill') as HTMLElement;

const modeNote = document.getElementById('mode-note') as HTMLElement;
const resultEl = document.getElementById('result') as HTMLElement;

const queue: QueueItem[] = [];
let running = false;
let dragCounter = 0;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function setNote(message: string, isError = false): void {
  modeNote.textContent = message;
  modeNote.classList.toggle('error', isError);
}

function updateProgress(current: number, total: number): void {
  progressWrapper.hidden = false;
  const pct = Math.round((current / total) * 100);
  progressStatusText.textContent = `変換中... (${current} / ${total})`;
  progressPercentText.textContent = `${pct}%`;
  progressBarFill.style.width = `${pct}%`;
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}

// --- ファイル管理 ---

function addFiles(files: File[]): void {
  if (running || files.length === 0) return;
  for (const file of files) {
    const format = detectFormat(file.name, file.type);
    let previewUrl: string | undefined;
    if (file.type.startsWith('image/') || format !== null) {
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (_e) {
        // オブジェクトURL生成失敗時はスキップ
      }
    }
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      format,
      previewUrl,
      formattedSize: formatBytes(file.size),
    });
  }
  refreshFileList();
}

function removeQueueItem(id: string): void {
  if (running) return;
  const idx = queue.findIndex((item) => item.id === id);
  if (idx !== -1) {
    const item = queue[idx];
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    queue.splice(idx, 1);
    refreshFileList();
  }
}

function clearQueue(): void {
  if (running) return;
  for (const item of queue) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
  queue.length = 0;
  refreshFileList();
}

function setQueueButtonsDisabled(disabled: boolean): void {
  clearAllBtn.disabled = disabled;
  const removeButtons = fileList.querySelectorAll<HTMLButtonElement>('.file-remove-btn');
  removeButtons.forEach((btn) => {
    btn.disabled = disabled;
  });
}

function refreshFileList(): void {
  fileList.textContent = '';
  const count = queue.length;
  fileListCard.hidden = count === 0;
  queueCountBadge.textContent = `${count} 件`;

  if (count === 0) return;

  for (const item of queue) {
    const row = document.createElement('div');
    row.className = 'file-row';

    // 左側（サムネイル＋メタ情報）
    const left = document.createElement('div');
    left.className = 'file-row-left';

    if (item.previewUrl && item.format !== null) {
      const img = document.createElement('img');
      img.className = 'file-thumb';
      img.src = item.previewUrl;
      img.alt = item.file.name;
      left.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'file-thumb-fallback';
      fallback.textContent = item.format?.ext.replace('.', '').toUpperCase() || 'FILE';
      left.appendChild(fallback);
    }

    const metaCol = document.createElement('div');
    metaCol.className = 'file-meta-col';
    const nameText = document.createElement('div');
    nameText.className = 'file-name-text';
    nameText.textContent = item.file.name;
    nameText.title = item.file.name;

    const subText = document.createElement('div');
    subText.className = 'file-sub-text';
    subText.textContent = item.formattedSize;

    metaCol.append(nameText, subText);
    left.appendChild(metaCol);

    // 右側（形式バッジ＋削除ボタン）
    const right = document.createElement('div');
    right.className = 'file-row-right';

    const badge = document.createElement('span');
    if (item.format) {
      badge.className = 'file-format-badge';
      badge.textContent = item.format.ext.replace('.', '').toUpperCase();
    } else {
      badge.className = 'file-format-badge unsupported';
      badge.textContent = '非対応';
    }
    right.appendChild(badge);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'file-remove-btn';
    removeBtn.disabled = running;
    removeBtn.setAttribute('aria-label', `${item.file.name} を削除`);
    removeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    removeBtn.addEventListener('click', () => removeQueueItem(item.id));
    right.appendChild(removeBtn);

    row.append(left, right);
    fileList.appendChild(row);
  }
}

// --- 変換実行 ---

function readLongEdge(): number | null {
  const value = Number(longEdgeInput.value);
  if (!Number.isInteger(value) || value < 1 || value > 20000) {
    setNote('長辺には 1 以上 20000 以下の整数を入力してください。', true);
    longEdgeInput.focus();
    return null;
  }
  return value;
}

function describeError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return '出力先フォルダへの書き込みが許可されませんでした';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function convert(): Promise<void> {
  const longEdge = readLongEdge();
  if (longEdge === null) return;
  if (queue.length === 0) {
    setNote('画像をドラッグ＆ドロップまたは選択して追加してください。', true);
    return;
  }

  const folderName = sanitizeFolderName(outputNameInput.value);
  const useFsaa = supportsDirectoryPicker();

  let outDir: OutputDirectoryHandle | null = null;
  let destinationLabel: string;

  if (useFsaa) {
    setNote('出力先フォルダを選択してください…');
    const baseDir = await pickTargetDirectory();
    if (!baseDir) {
      setNote('出力先フォルダの選択がキャンセルされたため、処理を中断しました。', true);
      return;
    }
    outDir = await ensureSubDirectory(baseDir, folderName);
    destinationLabel = `${baseDir.name}\\${folderName}\\`;
  } else {
    destinationLabel = `${folderName}.zip（ダウンロード）`;
  }

  running = true;
  startButton.disabled = true;
  setQueueButtonsDisabled(true);
  resultEl.hidden = true;

  const usedNames = new Set<string>();
  if (outDir) {
    // 仕様§11: 出力先フォルダ内の既存ファイル名を事前に取得し、同名上書きを防止
    await seedExistingNames(outDir, usedNames);
  }

  const snapshot = [...queue];
  const results: ProcessResult[] = [];
  const zipEntries: ZipEntry[] = [];
  const startedAt = Date.now();

  try {
    for (let i = 0; i < snapshot.length; i += 1) {
      const item = snapshot[i];
      updateProgress(i + 1, snapshot.length);

      if (!item.format) {
        results.push({
          sourceName: item.file.name,
          status: 'failed',
          error: '対応していない画像形式です',
        });
        continue;
      }

      try {
        const encode = resolveEncodeMime(item.format.mime);
        const blob = await resizeToBlob(item.file, longEdge, encode.mime);
        const stem = splitFileName(item.file.name).stem;
        const outExt = encode.downgraded ? '.png' : item.format.ext;
        const outputName = resolveFileName(`${stem}${outExt}`, usedNames);

        if (outDir) {
          await writeFile(outDir, outputName, blob);
        } else {
          zipEntries.push({ fileName: outputName, blob });
        }

        results.push({
          sourceName: item.file.name,
          outputName,
          status: 'success',
          note: encode.downgraded ? 'WebP非対応のためPNGで保存' : undefined,
        });
      } catch (error) {
        results.push({
          sourceName: item.file.name,
          status: 'failed',
          error: describeError(error),
        });
      }

      await nextTick();
    }

    if (!outDir && zipEntries.length > 0) {
      const zip = await buildZip(zipEntries, folderName);
      downloadBlob(zip, `${folderName}.zip`);
    }

    renderResult(resultEl, results, destinationLabel, Date.now() - startedAt);
    progressWrapper.hidden = true;
    setNote('');
  } finally {
    running = false;
    startButton.disabled = false;
    setQueueButtonsDisabled(false);
  }
}

// --- 初期化 ---

function init(): void {
  // ウィンドウ全体でのドラッグ＆ドロップ制御（ブラウザのファイル直接展開防止＋グローバル受付）
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter += 1;
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      dragOverlay.classList.add('active');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter = Math.max(0, dragCounter - 1);
    if (dragCounter === 0) {
      dragOverlay.classList.remove('active');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dragOverlay.classList.remove('active');
    dropZone.classList.remove('dragover');
    if (e.dataTransfer) {
      addFiles(filesFromDataTransfer(e.dataTransfer));
    }
  });

  // ファイル選択 input の change イベント（ネイティブ label 連携）
  fileInput.addEventListener('change', () => {
    addFiles(Array.from(fileInput.files ?? []));
    fileInput.value = '';
  });

  // ヘッダーの画像選択ボタン
  const headerSelectBtn = document.getElementById('header-select-btn');
  if (headerSelectBtn) {
    headerSelectBtn.addEventListener('click', () => {
      if (!running) fileInput.click();
    });
  }

  // 全件クリア
  clearAllBtn.addEventListener('click', clearQueue);

  // プリセットボタン連動
  for (const btn of Array.from(presetButtons)) {
    btn.addEventListener('click', () => {
      presetButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const size = btn.dataset.size;
      if (size) {
        longEdgeInput.value = size;
      }
    });
  }

  longEdgeInput.addEventListener('input', () => {
    const currentVal = longEdgeInput.value;
    presetButtons.forEach((b) => {
      b.classList.toggle('active', b.dataset.size === currentVal);
    });
  });

  // フォーム送信
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!running) {
      void convert().catch((error) => {
        setNote(`エラーが発生しました: ${describeError(error)}`, true);
      });
    }
  });

  // 環境案内メッセージ
  const notes: string[] = [];
  if (supportsDirectoryPicker()) {
    notes.push('「変換開始」を押すと保存先フォルダを選択できます。選択したフォルダ内にサブフォルダを作成して直接保存します。');
  } else {
    notes.push('※お使いのブラウザはフォルダ直接保存に対応していないため、ZIPファイルとして一括ダウンロードします。');
  }
  if (!supportsWebpEncode()) {
    notes.push('（WebP保存非対応環境のため、WebP画像はPNGに変換して保存します）');
  }
  setNote(notes.join(' '));
}

init();
