import { describe, expect, it } from 'vitest';
import { detectFormat } from '../src/core/format';

describe('detectFormat', () => {
  it('対応する拡張子(jpg/jpeg/PNG/webp)を判定する', () => {
    expect(detectFormat('IMG.JPG')).toEqual({ mime: 'image/jpeg', ext: '.jpg' });
    expect(detectFormat('photo.jpeg')).toEqual({ mime: 'image/jpeg', ext: '.jpeg' });
    expect(detectFormat('icon.PNG')).toEqual({ mime: 'image/png', ext: '.png' });
    expect(detectFormat('pic.webp', '')).toEqual({ mime: 'image/webp', ext: '.webp' });
  });

  it('拡張子から判定できない場合は MIME タイプで判定する', () => {
    expect(detectFormat('blob', 'image/png')).toEqual({ mime: 'image/png', ext: '.png' });
    expect(detectFormat('noext', 'IMAGE/WEBP; charset=binary')).toEqual({
      mime: 'image/webp',
      ext: '.webp',
    });
  });

  it('非対応形式は null を返す(gif/bmp/txt/拡張子なし)', () => {
    expect(detectFormat('anime.gif')).toBeNull();
    expect(detectFormat('doc.bmp')).toBeNull();
    expect(detectFormat('readme.txt')).toBeNull();
    expect(detectFormat('noext', '')).toBeNull();
    expect(detectFormat('archive.gif', 'image/gif')).toBeNull();
    expect(detectFormat('', '')).toBeNull();
  });

  it('ピリオドのみ・隠しファイル風の名前も安全に扱う', () => {
    expect(detectFormat('.jpg')).toBeNull(); // dot <= 0 → 拡張子なし扱い
    expect(detectFormat('name.')).toBeNull();
  });
});
