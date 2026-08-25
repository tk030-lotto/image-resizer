import { describe, it, expect } from 'vitest';
import { resolveFileName, splitFileName } from '../src/core/filename';

describe('splitFileName', () => {
  it('ファイル名を語幹と拡張子に分割する', () => {
    expect(splitFileName('image.jpg')).toEqual({ stem: 'image', ext: '.jpg' });
    expect(splitFileName('archive.tar.gz')).toEqual({ stem: 'archive.tar', ext: '.gz' });
    expect(splitFileName('noext')).toEqual({ stem: 'noext', ext: '' });
  });
});

describe('resolveFileName', () => {
  it('未使用の名前はそのまま返す', () => {
    const used = new Set<string>();
    expect(resolveFileName('image.jpg', used)).toBe('image.jpg');
    expect(used.has('image.jpg')).toBe(true);
  });

  it('重複時は連番を付与する', () => {
    const used = new Set<string>();
    resolveFileName('image.jpg', used);
    expect(resolveFileName('image.jpg', used)).toBe('image_001.jpg');
    expect(resolveFileName('image.jpg', used)).toBe('image_002.jpg');
  });

  it('大文字小文字の違いも重複として扱い連番にする', () => {
    const used = new Set<string>();
    resolveFileName('Photo.JPG', used);
    expect(resolveFileName('photo.jpg', used)).toBe('photo_001.jpg');
  });
});
