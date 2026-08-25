import { describe, it, expect } from 'vitest';
import { sanitizeFolderName } from '../src/io/writer';

describe('sanitizeFolderName', () => {
  it('有効なフォルダ名はそのまま返す', () => {
    expect(sanitizeFolderName('resized')).toBe('resized');
    expect(sanitizeFolderName('my_photos')).toBe('my_photos');
  });

  it('Windows予約文字をハイフンに置換する', () => {
    expect(sanitizeFolderName('output:1/2*3?4"5<6>7|8')).toBe('output-1-2-3-4-5-6-7-8');
  });

  it('空文字やドットのみの場合はfallbackを返す', () => {
    expect(sanitizeFolderName('')).toBe('resized');
    expect(sanitizeFolderName('   ')).toBe('resized');
    expect(sanitizeFolderName('.')).toBe('resized');
    expect(sanitizeFolderName('..')).toBe('resized');
  });
});
