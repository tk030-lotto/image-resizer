import { describe, it, expect } from 'vitest';
import { sanitizeFolderName, seedExistingNames, type OutputDirectoryHandle } from '../src/io/writer';

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

  it('末尾のドットや空白を除去する(Windows無効名対策)', () => {
    expect(sanitizeFolderName('folder.')).toBe('folder');
    expect(sanitizeFolderName('folder.  ')).toBe('folder');
    expect(sanitizeFolderName('photos...')).toBe('photos');
  });
});

describe('seedExistingNames', () => {
  it('ディレクトリ内の既存ファイル名を小文字でSetに取り込む', async () => {
    const mockDir: Partial<OutputDirectoryHandle> & { values: () => AsyncIterable<{ name: string; kind: string }> } = {
      kind: 'directory',
      name: 'resized',
      values: async function* () {
        yield { name: 'photo_001.jpg', kind: 'file' };
        yield { name: 'IMAGE.PNG', kind: 'file' };
      },
    };

    const used = new Set<string>();
    await seedExistingNames(mockDir as unknown as OutputDirectoryHandle, used);

    expect(used.has('photo_001.jpg')).toBe(true);
    expect(used.has('image.png')).toBe(true);
    expect(used.has('other.jpg')).toBe(false);
  });
});
