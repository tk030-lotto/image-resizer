/** ドラッグ＆ドロップ(仕様§7)で得られる DataTransfer からファイル一覧を取り出す。 */

export function filesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }
    if (files.length > 0) {
      return files;
    }
  }
  return Array.from(dataTransfer.files ?? []);
}
