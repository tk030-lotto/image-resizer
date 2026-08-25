/** 対応画像形式の判定(仕様§4)とエンコード可否チェック。 */

export type SupportedMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageFormat {
  /** エンコードに使う MIME タイプ */
  mime: SupportedMime;
  /** 出力ファイル名に使う拡張子(元ファイルのものを小文字化して維持、".jpg" 形式) */
  ext: string;
}

const EXT_TO_MIME: Record<string, SupportedMime> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const SUPPORTED_MIMES = new Set(Object.values(EXT_TO_MIME));

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0 || dot === fileName.length - 1) {
    return '';
  }
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * ドロップされたファイルが対応形式かどうかを判定する。
 * 判定は拡張子を優先し、拡張子から判定できない場合は MIME タイプで補う。
 * 非対応の場合は null を返す。
 */
export function detectFormat(fileName: string, mimeType = ''): ImageFormat | null {
  const ext = extensionOf(fileName);
  if (ext) {
    const mime = EXT_TO_MIME[ext];
    if (mime) {
      return { mime, ext: `.${ext}` };
    }
  }

  const normalizedMime = mimeType.split(';')[0].trim().toLowerCase();
  if (SUPPORTED_MIMES.has(normalizedMime as SupportedMime)) {
    const mime = normalizedMime as SupportedMime;
    const extFromMime = mime === 'image/jpeg' ? 'jpg' : mime.slice('image/'.length);
    return { mime, ext: `.${extFromMime}` };
  }

  return null;
}

let webpEncodeSupported: boolean | null = null;

/** 現在のブラウザが canvas.toBlob による WebP エンコードに対応しているか。 */
export function supportsWebpEncode(): boolean {
  if (webpEncodeSupported === null) {
    try {
      const probe = document.createElement('canvas');
      probe.width = 1;
      probe.height = 1;
      webpEncodeSupported = probe.toDataURL('image/webp').startsWith('data:image/webp');
    } catch (_e) {
      webpEncodeSupported = false;
    }
  }
  return webpEncodeSupported;
}

export interface EncodeMime {
  mime: SupportedMime;
  /** WebP 非対応環境で PNG へ代替した場合に true */
  downgraded: boolean;
}

/**
 * 指定 MIME でのエンコード可否を確認し、必要なら代替 MIME を返す。
 */
export function resolveEncodeMime(mime: SupportedMime): EncodeMime {
  if (mime === 'image/webp' && !supportsWebpEncode()) {
    return { mime: 'image/png', downgraded: true };
  }
  return { mime, downgraded: false };
}
