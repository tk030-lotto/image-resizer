/**
 * 変換結果の出力先(仕様§9〜§11)。
 * - File System Access API 対応ブラウザ: 選択フォルダ内に出力フォルダ(resized)を作り直接書き込む
 * - 非対応ブラウザ: resized.zip としてダウンロードする
 *
 * lib.dom の型定義バージョン差異に依存しないよう、必要な API は独自の構造化タイプで扱う。
 */

import { zipSync, type Zippable } from 'fflate';

export interface WritableLike {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

export interface OutputFileHandle {
  createWritable(options?: { keepExistingData?: boolean }): Promise<WritableLike>;
}

export interface OutputDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<OutputDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<OutputFileHandle>;
}

type DirectoryPicker = (options?: {
  id?: string;
  mode?: 'read' | 'readwrite';
}) => Promise<OutputDirectoryHandle>;

/** ブラウザがフォルダ選択(File System Access API)に対応しているか。 */
export function supportsDirectoryPicker(): boolean {
  return (
    typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker ===
    'function'
  );
}

/** 出力基点となるフォルダを選択させる。キャンセル時や非対応時は null を返す。 */
export async function pickTargetDirectory(): Promise<OutputDirectoryHandle | null> {
  const picker = (window as unknown as { showDirectoryPicker?: DirectoryPicker })
    .showDirectoryPicker;
  if (typeof picker !== 'function') {
    return null;
  }
  try {
    return await picker.call(window, { id: 'image-resizer-output', mode: 'readwrite' });
  } catch {
    // AbortError(ユーザーがキャンセル)など
    return null;
  }
}

/** 親フォルダ内に出力サブフォルダを作成(または取得)する。 */
export async function ensureSubDirectory(
  parent: OutputDirectoryHandle,
  name: string,
): Promise<OutputDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true });
}

/** サブフォルダへファイルを書き込む。 */
export async function writeFile(
  dir: OutputDirectoryHandle,
  fileName: string,
  blob: Blob,
): Promise<void> {
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/** フォルダ名として安全でない文字を置換する(Windows の予約文字など)。 */
export function sanitizeFolderName(name: string, fallback = 'resized'): string {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]/g, '-').replace(/^\.+$/, '');
  return cleaned.length > 0 ? cleaned : fallback;
}

export interface ZipEntry {
  fileName: string;
  blob: Blob;
}

/** entries を folderName/ 配下にまとめた ZIP Blob を生成する。画像は既に圧縮済みのため level 0。 */
export async function buildZip(entries: ZipEntry[], folderName: string): Promise<Blob> {
  const folder: Zippable = {};
  for (const entry of entries) {
    folder[entry.fileName] = new Uint8Array(await entry.blob.arrayBuffer());
  }
  const zipped = zipSync({ [folderName]: folder } as Zippable, { level: 0 });
  return new Blob([zipped], { type: 'application/zip' });
}

/** Blob をファイルとしてダウンロードさせる。 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
