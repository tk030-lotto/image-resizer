/**
 * ドラッグ＆ドロップおよびファイル選択からファイル一覧を取り出す純粋関数。
 */

export function filesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const result: File[] = [];
  const seenKeys = new Set<string>();

  // 1. dataTransfer.files を最優先でチェック
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file && file instanceof File) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          result.push(file);
        }
      }
    }
  }

  // 2. dataTransfer.items からのフォールバック
  if (result.length === 0 && dataTransfer.items && dataTransfer.items.length > 0) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          const key = `${file.name}-${file.size}-${file.lastModified}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            result.push(file);
          }
        }
      }
    }
  }

  return result;
}
