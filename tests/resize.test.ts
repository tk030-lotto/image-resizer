import { describe, it, expect } from 'vitest';
import { calculateDimensions } from '../src/core/resize';

describe('calculateDimensions (リサイズ寸法計算)', () => {
  it('横長画像を長辺1280pxへ縮小する', () => {
    const dim = calculateDimensions(4000, 3000, 1280);
    expect(dim).toEqual({ width: 1280, height: 960 });
  });

  it('縦長画像を長辺1280pxへ縮小する', () => {
    const dim = calculateDimensions(3000, 4000, 1280);
    expect(dim).toEqual({ width: 960, height: 1280 });
  });

  it('正方形画像を長辺1280pxへ縮小する', () => {
    const dim = calculateDimensions(4000, 4000, 1280);
    expect(dim).toEqual({ width: 1280, height: 1280 });
  });

  it('元画像が指定サイズより小さい場合は拡大せず元寸法を返す', () => {
    const dim = calculateDimensions(800, 600, 1280);
    expect(dim).toEqual({ width: 800, height: 600 });
  });

  it('長辺が指定サイズと等しい場合は元寸法を返す', () => {
    const dim = calculateDimensions(1280, 720, 1280);
    expect(dim).toEqual({ width: 1280, height: 720 });
  });

  it('実写解像度(4032x3024)で計算する', () => {
    const dim = calculateDimensions(4032, 3024, 1080);
    expect(dim).toEqual({ width: 1080, height: 810 });
  });

  it('丸めが発生するケースで四捨五入する', () => {
    const dim = calculateDimensions(1366, 768, 800);
    expect(dim.width).toBe(800);
    expect(dim.height).toBe(450);
  });

  it('極小サイズでも最低1pxを保証する', () => {
    const dim = calculateDimensions(1000, 1, 10);
    expect(dim.width).toBe(10);
    expect(dim.height).toBe(1);
  });

  it('不正な入力でRangeErrorを投げる', () => {
    expect(() => calculateDimensions(0, 100, 1280)).toThrow(RangeError);
    expect(() => calculateDimensions(-10, 100, 1280)).toThrow(RangeError);
    expect(() => calculateDimensions(100, 0, 1280)).toThrow(RangeError);
    expect(() => calculateDimensions(100, 100, 0)).toThrow(RangeError);
    expect(() => calculateDimensions(100, 100, -5)).toThrow(RangeError);
    expect(() => calculateDimensions(100, 100, 12.5)).toThrow(RangeError);
    expect(() => calculateDimensions(NaN, 100, 1280)).toThrow(RangeError);
    expect(() => calculateDimensions(100, Infinity, 1280)).toThrow(RangeError);
  });
});
