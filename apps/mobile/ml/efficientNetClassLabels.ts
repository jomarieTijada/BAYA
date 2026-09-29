/**
 * Model output index order derived from sorted(df["label"].astype(str).unique())
 * in the authoritative EfficientNet training notebook, cell 15. Cell 41's
 * grouping audit confirms these 63 labels occur exactly once.
 */
export const EFFICIENTNET_CLASS_LABELS = [
  'a', 'b', 'ba', 'be_bi', 'bo_bu', 'd', 'da_ra', 'de_di', 'do_du', 'e_i',
  'g', 'ga', 'ge_gi', 'go_gu', 'h', 'ha', 'he_hi', 'ho_hu', 'k', 'ka',
  'ke_ki', 'ko_ku', 'l', 'la', 'le_li', 'lo_lu', 'm', 'ma', 'me_mi', 'mo_mu',
  'n', 'na', 'ne_ni', 'ng', 'nga', 'nge_ngi', 'ngo_ngu', 'no_nu', 'o_u', 'p',
  'pa', 'pe_pi', 'po_pu', 'r', 'ra', 're_ri', 'ro_ru', 's', 'sa', 'se_si',
  'so_su', 't', 'ta', 'te_ti', 'to_tu', 'w', 'wa', 'we_wi', 'wo_wu', 'y',
  'ya', 'ye_yi', 'yo_yu',
] as const;

export const EFFICIENTNET_LABEL_TO_ID = Object.fromEntries(
  EFFICIENTNET_CLASS_LABELS.map((label, index) => [label, index]),
) as Record<(typeof EFFICIENTNET_CLASS_LABELS)[number], number>;
