/** Metro-bundled Gavino glyphs. Keep the require calls static for native builds. */
export const baybayinAssets = {
  a: require('../assets/illustrations/baybayin/gavino/a.png'),
  e_i: require('../assets/illustrations/baybayin/gavino/e_i.png'),
  o_u: require('../assets/illustrations/baybayin/gavino/o_u.png'),
  ba: require('../assets/illustrations/baybayin/gavino/ba.png'),
  ka: require('../assets/illustrations/baybayin/gavino/ka.png'),
  da_ra: require('../assets/illustrations/baybayin/gavino/da_ra.png'),
  ga: require('../assets/illustrations/baybayin/gavino/ga.png'),
  ha: require('../assets/illustrations/baybayin/gavino/ha.png'),
  la: require('../assets/illustrations/baybayin/gavino/la.png'),
  ma: require('../assets/illustrations/baybayin/gavino/ma.png'),
  na: require('../assets/illustrations/baybayin/gavino/na.png'),
  nga: require('../assets/illustrations/baybayin/gavino/nga.png'),
  pa: require('../assets/illustrations/baybayin/gavino/pa.png'),
  sa: require('../assets/illustrations/baybayin/gavino/sa.png'),
  ta: require('../assets/illustrations/baybayin/gavino/ta.png'),
  wa: require('../assets/illustrations/baybayin/gavino/wa.png'),
  ya: require('../assets/illustrations/baybayin/gavino/ya.png'),
} as const;

export type BaybayinAssetId = keyof typeof baybayinAssets;

export function getBaybayinAsset(id: BaybayinAssetId): number {
  return baybayinAssets[id];
}
