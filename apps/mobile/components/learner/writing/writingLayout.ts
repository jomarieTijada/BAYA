/** One adaptive layout for every writing topic and character. */
export function getWritingLayout(width: number, height: number) {
  const isLandscape = width > height;
  let columns: 1 | 2 | 3;
  if (width >= 980 || (isLandscape && width >= 600)) {
    columns = 3;
  } else {
    if (width >= 700) {
      columns = 2;
    } else {
      columns = 1;
    }
  }
  return {
    columns,
    compact: width < 700 || height < 650,
    dense: columns === 3 && width < 980,
  } as const;
}
