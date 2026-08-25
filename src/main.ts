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
  supportsDirectoryPicker,
  writeFile,
  type OutputDirectoryHandle,
  type ZipEntry,
} from './io/writer';
import { renderResult, type ProcessResult } from './ui/result';

interface QueueItem {
  file: File;
  format: ImageFormat | null; // null = 非対応形式(仕様§12でエラー扱い)
}

const dropZone = document.getElementById('drop-zone') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const fileList = document.getElementById('file-list') as HTMLElement;
const form = document.getElementById('convert-form') as HTMLFormElement;
const longEdgeInput = document.getElementById('long-edge') as HTMLInputElement;
const outputNameInput = document.getElementById('output-name') as HTMLInputElement;
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const progressEl = document.getElementById('progress') as HTMLElement;
const modeNote = document.getElementById('mode-note') as HTMLElement;
const resultEl = document.getElementById('result') as HTMLElement;

/** ドロップされたファイルの待ち行列 */
const queue: QueueItem[] = [];
let running = false;

function setNote(message: string, isError = false): void {
  modeNote.textContent = message;
  modeNote.classList.toggle('error', isError);
}

function setProgress(current: number, total: number): void {
  progressEl.hidden = false;
  progressEl.textContent = `変換中… ${current} / ${total}`;
}

/** UI を1フレーム描画させるための待ち */
function nextTick(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}

// --- ファイル受け入れ ---

function addFiles(files: File[]): void {
  if (files.length === 0) return;
  for (const file of files) {
    queue.push({ file, format: detectFormat(file.name, file.type) });
  }
  refreshFileList();
}

function refreshFileList(): void {
  fileList.textContent = '';
  fileList.hidden = queue.length === 0;
  if (queue.length === 0) return;

  const head = document.createElement('div');
  head.className = 'file-head';
  const count = document.createElement('span');
  count.textContent = `${queue.length}件のファイル`;
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'file-clear';
  clearButton.textContent = 'すべてクリア';
  clearButton.addEventListener('click', () => {
    queue.length = 0;
    refreshFileList();
  });
  head.append(count, clearButton);
  fileList.appendChild(head);

  const list = document.createElement('ul');
  for (const item of queue) {
    const li = document.createElement('li');
    li.title = item.file.name;
    li.append(item.file.name);
    if (!item.format) {
      const tag = document.createElement('span');
      tag.className = 'unsupported';
      tag.textContent = '　（未対応形式）';
      li.appendChild(tag);
    }
    list.appendChild(li);
  }
  fileList.appendChild(list);
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
    return '出力先への書き込みが許可されませんでした';
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
    setNote('まず画像をドロップしてください。', true);
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
      setNote('出力先フォルダの選択をキャンセルしたため、変換を中止しました。', true);
      return;
    }
    outDir = await ensureSubDirectory(baseDir, folderName);
    destinationLabel = `${baseDir.name}\\${folderName}\\`;
  } else {
    destinationLabel = `${folderName}.zip（ダウンロード）`;
  }

  running = true;
  startButton.disabled = true;
  resultEl.hidden = true;

  const usedNames = new Set<string>();
  const results: ProcessResult[] = [];
  const zipEntries: ZipEntry[] = [];
  const startedAt = Date.now();

  try {
    for (let i = 0; i < queue.length; i += 1) {
      const item = queue[i];
      setProgress(i + 1, queue.length);

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
          note: encode.downgraded ? 'WebP保存非対応のためPNGで保存' : undefined,
        });
      } catch (error) {
        results.push({
          sourceName: item.file.name,
          status: 'failed',
          error: describeError(error),
        });
      }

      // UI を固まらせないよう1枚ごとに制御を返す
      await nextTick();
    }

    if (!outDir && zipEntries.length > 0) {
      const zip = await buildZip(zipEntries, folderName);
      downloadBlob(zip, `${folderName}.zip`);
    }

    renderResult(resultEl, results, destinationLabel, Date.now() - startedAt);
    progressEl.hidden = true;
    setNote('');
  } finally {
    running = false;
    startButton.disabled = false;
  }
}

// --- 初期化 ---

function init(): void {
  // ドラッグ＆ドロップ
  for (const eventName of ['dragenter', 'dragover'] as const) {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add('dragover');
    });
  }
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    if (event.dataTransfer) {
      addFiles(filesFromDataTransfer(event.dataTransfer));
    }
  });

  // クリックでのファイル選択(D&Dの補助)
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    addFiles(Array.from(fileInput.files ?? []));
    fileInput.value = '';
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!running) {
      void convert().catch((error) => {
        setNote(`予期しないエラーが発生しました: ${describeError(error)}`, true);
      });
    }
  });

  // 環境に応じた案内表示
  const notes: string[] = [];
  if (supportsDirectoryPicker()) {
    notes.push(
      '「変換開始」を押すと出力先フォルダを選択できます。選択したフォルダ内に出力フォルダを作って保存します。',
    );
  } else {
    notes.push(
      'このブラウザはフォルダ直接保存に対応していないため、ZIPファイルとしてダウンロードします。',
    );
  }
  if (!supportsWebpEncode()) {
    notes.push('※このブラウザはWebP形式の保存に対応していないため、WebP画像はPNGで保存されます。');
  }
  setNote(notes.join(''));
}

init();


