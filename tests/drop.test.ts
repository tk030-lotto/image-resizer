import { describe, it, expect } from 'vitest';
import { filesFromDataTransfer } from '../src/io/drop';

describe('filesFromDataTransfer', () => {
  it('dataTransfer.files から正しくファイルを取り出す', () => {
    const fakeFile1 = new File(['123'], 'test1.jpg', { type: 'image/jpeg' });
    const fakeFile2 = new File(['456'], 'test2.png', { type: 'image/png' });

    const fakeDataTransfer = {
      files: [fakeFile1, fakeFile2] as unknown as FileList,
      items: [] as unknown as DataTransferItemList,
    } as DataTransfer;

    const files = filesFromDataTransfer(fakeDataTransfer);
    expect(files).toHaveLength(2);
    expect(files[0].name).toBe('test1.jpg');
    expect(files[1].name).toBe('test2.png');
  });

  it('dataTransfer.items からフォールバックしてファイルを取り出す', () => {
    const fakeFile = new File(['789'], 'test3.webp', { type: 'image/webp' });
    const fakeItem = {
      kind: 'file',
      getAsFile: () => fakeFile,
    };

    const fakeDataTransfer = {
      files: [] as unknown as FileList,
      items: [fakeItem] as unknown as DataTransferItemList,
    } as DataTransfer;

    const files = filesFromDataTransfer(fakeDataTransfer);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('test3.webp');
  });

  it('空の DataTransfer の場合は空配列を返す', () => {
    const fakeDataTransfer = {
      files: [] as unknown as FileList,
      items: [] as unknown as DataTransferItemList,
    } as DataTransfer;

    const files = filesFromDataTransfer(fakeDataTransfer);
    expect(files).toEqual([]);
  });
});
