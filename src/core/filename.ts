/**
 * 出力ファイル名の決定(仕様§11)。
 * 同名ファイルが存在する場合は image_001.jpg 形式の連番で別名保存する。
 * 大文字小文字の違いも同一扱いとする(Windows ファイルシステム想定)。
 */

export interface SplitName {
  /** 拡張子を除いた部分 */
  stem: string;
  /** ピリオド込みの拡張子(".jpg")。拡張子がない場合は空文字 */
  ext: string;
}

export function splitFileName(name: string): SplitName {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) {
    return { stem: name, ext: '' };
  }
  return { stem: name.slice(0, dot), ext: name.slice(dot) };
}

/**
 * 出力名の重複を避けたファイル名を返す。使用した名前は used に記録される。
 * @param desiredName 希望する出力ファイル名
 * @param used このセッションで既に使用したファイル名(小文字化済みキー)のセット
 */
export function resolveFileName(desiredName: string, used: Set<string>): string {
  const key = desiredName.toLowerCase();
  if (!used.has(key)) {
    used.add(key);
    return desiredName;
  }

  const { stem, ext } = splitFileName(desiredName);
  for (let i = 1; i <= 9999; i += 1) {
    const candidate = `${stem}_${String(i).padStart(3, '0')}${ext}`;
    const candidateKey = candidate.toLowerCase();
    if (!used.has(candidateKey)) {
      used.add(candidateKey);
      return candidate;
    }
  }

  const fallback = `${stem}_${Date.now()}${ext}`;
  used.add(fallback.toLowerCase());
  return fallback;
}
