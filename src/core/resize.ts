/**
 * リサイズ仕様(§5・§6)とブラウザでの変換パイプライン。
 * - 長辺が指定値になるよう縦横比を維持して縮小する
 * - 元画像の長辺が指定値以下の場合は拡大しない(画質劣化防止)
 * - EXIF Orientation(スマホ写真の回転情報)を反映してから寸法を判定する
 */

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * リサイズ後の寸法を計算する純粋関数。
 * @throws RangeError 元画像サイズまたは指定値が不正な場合
 */
export function calculateDimensions(width: number, height: number, longEdge: number): Dimensions {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new RangeError(`元画像のサイズが不正です: ${width} x ${height}`);
  }
  if (!Number.isInteger(longEdge) || longEdge < 1) {
    throw new RangeError(`サイズ指定が不正です: ${longEdge}px`);
  }

  const longest = Math.max(width, height);
  // 指定が現状の長辺以上なら拡大せず元寸法を返す(仕様§6)
  if (longEdge >= longest) {
    return { width, height };
  }

  const scale = longEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * EXIF Orientation を反映して画像をデコードする(非対応環境は標準デコードへフォールバック)。
 */
async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch (_err) {
    // 古いブラウザや非対応環境向けフォールバック
    return await createImageBitmap(blob);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画像のエンコードに失敗しました'))),
      mime,
      quality,
    );
  });
}

/**
 * 画像 Blob を指定した長辺・形式へリサイズし、Blob として返す。
 * @param source 元画像(JPEG / PNG / WebP)
 * @param longEdge リサイズ後の長辺(px)
 * @param mime 出力 MIME タイプ(detectFormat / resolveEncodeMime の結果)
 * @param quality JPEG/WebP の品質(0〜1)
 */
export async function resizeToBlob(
  source: Blob,
  longEdge: number,
  mime: string,
  quality = 0.92,
): Promise<Blob> {
  const bitmap = await decodeImage(source);
  try {
    const target = calculateDimensions(bitmap.width, bitmap.height, longEdge);

    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas を初期化できませんでした');
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, target.width, target.height);

    return await canvasToBlob(canvas, mime, quality);
  } finally {
    bitmap.close();
  }
}
