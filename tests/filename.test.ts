import { describe, expect, it } from 'vitest';
import { resolveFileName, splitFileName } from '../src/core/filename';

describe('splitFileName', () => {
  it('ファイル名と拡張子に分割する', () => {
    expect(splitFileName('image.jpg')).toEqual({ stem: 'image', ext: '.jpg' });
    expect(splitFileName('photo.final.PNG')).toEqual({ stem: 'photo.final', ext: '.PNG' });
  });

  it('拡張子がない・不正な名前を安全に扱う', () => {
    expect(splitFileName('noext')).toEqual({ stem: 'noext', ext: '' });
    expect(splitFileName('.jpg')).toEqual({ stem: '.jpg', ext: '' });
    expect(splitFileName('name.')).toEqual({ stem: 'name.', ext: '' });
  });
});

describe('resolveFileName', () => {
  it('重複しない名前はそのまま使う', () => {
    const used = new Set<string>();
    expect(resolveFileName('image.jpg', used)).toBe('image.jpg');
    expect(used.has('image.jpg')).toBe(true);
  });

  it('同名が既にある場合は image_001.jpg 形式の連番になる(仕様§11)', () => {
    const used = new Set(['image.jpg']);
    expect(resolveFileName('image.jpg', used)).toBe('image_001.jpg');
    expect(resolveFileName('image.jpg', used)).toBe('image_002.jpg');
  });

  it('拡張子が違えば別名として扱う', () => {
    const used = new Set(['logo.png']);
    expect(resolveFileName('logo.jpg', used)).toBe('logo.jpg');
  });

  it('大文字小文字の違いも同一扱いする(Windows想定)', () => {
    const used = new Set<string>();
    expect(resolveFileName('photo.JPG', used)).toBe('photo.JPG');
    expect(resolveFileName('photo.jpg', used)).toBe('photo_001.jpg');
  });

  it('10件目以降も桁を揃えた連番になる', () => {
    const used = new Set<string>(['a.png']);
    for (let i = 1; i <= 9; i += 1) {
      used.add(`a_${String(i).padStart(3, '0')}.png`);
    }
    expect(resolveFileName('a.png', used)).toBe('a_010.png');
    expect(resolveFileName('a.png', used)).toBe('a_011.png');
  });

  it('使用した名前はすべて記録される', () => {
    const used = new Set<string>();
    const first = resolveFileName('x.webp', used);
    const second = resolveFileName('x.webp', used);
    expect(first).toBe('x.webp');
    expect(second).toBe('x_001.webp');
    expect(used.size).toBe(2);
  });
});
