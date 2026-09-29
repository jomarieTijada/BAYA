import { getWritingLayout } from '../writingLayout';

describe('writing practice layout', () => {
  it.each([
    [390, 844, 1, false],
    [768, 1024, 2, false],
    [640, 360, 3, true],
    [726, 360, 3, true],
    [844, 390, 3, true],
    [1170, 540, 3, false],
    [1440, 900, 3, false],
  ])('uses %i×%i as %i columns (dense: %s)', (width, height, columns, dense) => {
    expect(getWritingLayout(width, height)).toMatchObject({ columns, dense });
  });
});
