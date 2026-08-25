import { describe, it, expect } from 'vitest';
import { detectFormat } from '../src/core/format';

describe('detectFormat', () => {
  it('対応拡張子(jpg, jpeg, png, webp)を判定する', () => {
    expect(detectFormat('photo.jpg')).toEqual({ mime: 'image/jpeg', ext: '.jpg' });
    expect(detectFormat('photo.jpeg')).toEqual({ mime: 'image/jpeg', ext: '.jpeg' });
    expect(detectFormat('photo.PNG')).toEqual({ mime: 'image/png', ext: '.png' });
    expect(detectFormat('photo.webp')).toEqual({ mime: 'image/webp', ext: '.webp' });
  });

  it('拡張子がない場合MIMEタイプで補完する', () => {
    expect(detectFormat('blob', 'image/jpeg')).toEqual({ mime: 'image/jpeg', ext: '.jpg' });
    expect(detectFormat('blob', 'image/png')).toEqual({ mime: 'image/png', ext: '.png' });
    expect(detectFormat('blob', 'image/webp')).toEqual({ mime: 'image/webp', ext: '.webp' });
  });

  it('非対応形式でnullを返す', () => {
    expect(detectFormat('doc.pdf')).toBeNull();
    expect(detectFormat('photo.gif')).toBeNull();
    expect(detectFormat('photo.bmp')).toBeNull();
    expect(detectFormat('file.txt', 'text/plain')).toBeNull();
  });

  it('ピリオドのみや異常なファイル名でnullを返す', () => {
    expect(detectFormat('.')).toBeNull();
    expect(detectFormat('..')).toBeNull();
    expect(detectFormat('file.')).toBeNull();
  });
});
