import { describe, expect, it } from 'vitest';
import { sanitizeFolderName } from '../src/io/writer';

describe('sanitizeFolderName', () => {
  it('通常の名前はそのまま返す', () => {
    expect(sanitizeFolderName('resized')).toBe('resized');
    expect(sanitizeFolderName('my photos')).toBe('my photos');
    expect(sanitizeFolderName('画像出力')).toBe('画像出力');
  });

  it('前後の空白を除去する', () => {
    expect(sanitizeFolderName('  resized  ')).toBe('resized');
  });

  it('Windows で利用できない文字を置換する', () => {
    expect(sanitizeFolderName('a/b\\c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j');
  });

  it('ドットのみの名前はフォールバックになる', () => {
    expect(sanitizeFolderName('..')).toBe('resized');
    expect(sanitizeFolderName('.', 'out')).toBe('out');
  });

  it('空文字はフォールバックになる', () => {
    expect(sanitizeFolderName('')).toBe('resized');
    expect(sanitizeFolderName('   ', 'out')).toBe('out');
  });
});
