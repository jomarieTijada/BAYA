/** One adaptive layout for every writing topic and character. */
export function getWritingLayout(width: number, height: number) {
  const isLandscape = width > height;
  const columns: 1 | 2 | 3 = width >= 980 || (isLandscape && width >= 600) ? 3 : width >= 700 ? 2 : 1;
  return {
    columns,
    compact: width < 700 || height < 650,
    dense: columns === 3 && width < 980,
  } as const;
}
