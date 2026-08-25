import { describe, expect, it } from 'vitest';
import { calculateDimensions } from '../src/core/resize';

describe('calculateDimensions', () => {
  it('横長画像: 4000x3000 を長辺1280にすると 1280x960 になる', () => {
    expect(calculateDimensions(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
  });

  it('縦長画像: 3000x4000 を長辺1280にすると 960x1280 になる', () => {
    expect(calculateDimensions(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
  });

  it('正方形: 4000x4000 を長辺1280にすると 1280x1280 になる', () => {
    expect(calculateDimensions(4000, 4000, 1280)).toEqual({ width: 1280, height: 1280 });
  });

  it('小さい画像は拡大しない(800x600 @1280 → 800x600)', () => {
    expect(calculateDimensions(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it('長辺が指定値と等しい場合も元寸法を維持する', () => {
    expect(calculateDimensions(1280, 720, 1280)).toEqual({ width: 1280, height: 720 });
  });

  it('実写ケース: 4032x3024 @1080 → 1080x810', () => {
    expect(calculateDimensions(4032, 3024, 1080)).toEqual({ width: 1080, height: 810 });
  });

  it('割り切れない場合は四捨五入する(1366x768 @800 → 800x450)', () => {
    expect(calculateDimensions(1366, 768, 800)).toEqual({ width: 800, height: 450 });
  });

  it('極端に細い画像でも高さ(短辺)は最低1pxを保証する', () => {
    expect(calculateDimensions(10000, 1, 5000)).toEqual({ width: 5000, height: 1 });
    expect(calculateDimensions(2, 10000, 1)).toEqual({ width: 1, height: 1 });
  });

  it.each([0, -100, NaN, Infinity, 1.5])('不正なサイズ指定 %s は RangeError', (longEdge) => {
    expect(() => calculateDimensions(4000, 3000, longEdge)).toThrow(RangeError);
  });

  it.each([
    [0, 3000],
    [4000, -1],
    [NaN, 3000],
  ])('不正な元画像サイズ (%s x %s) は RangeError', (width, height) => {
    expect(() => calculateDimensions(width, height, 1280)).toThrow(RangeError);
  });
});
