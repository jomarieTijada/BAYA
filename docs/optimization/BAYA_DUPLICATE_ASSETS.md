# Duplicate asset audit

SHA-256 identified 119 duplicate groups across source, public, recording and archival roots. The baseline deployment contains **zero byte-identical duplicate files**. No source artwork was deleted, and no unsupported deduplication savings are claimed.

Most groups cross the archived Gavino/tracing collections and the app's approved copies. Keeping those source archives does not add export bytes. Brand/app icons may share pixels but have distinct manifest/native roles. Exact hash identity alone does not establish that an archive may be removed.

`perceptual-candidates.json` records 98 equal dHash candidate groups. dHash is a coarse grayscale similarity signal, not a character-identity test. Distinct characters, kudlit positions, colors, validated forms and attribution contexts are retained. No perceptual candidate was merged.

The storybook's Ba, Be/Bi and Bo/Bu references now call the existing tracing-guide registry. Their logical labels and exact underlying images remain unchanged. The mascot frame order has one canonical source (`frameSources.ts`); its `.web.ts` file is generated and checked, not an independently edited registry. Existing glyph and audio registries remain authoritative. Existing BayaMascot/BayaFrameRenderer, LocalPicture, PronunciationButton and learning card components already provide composition; adding another generic card layer would not compress media.

No file is declared unused merely because a literal string was absent. Source assets not found by export SHA-256 remain reachability-review candidates (native app icons, archival sources and format alternatives included). Unused count remains unknown. Only the 18 font families proved unreachable by the narrowed import were excluded by Metro.

## Exact duplicate groups (retained)

### Group 1

- `apps/mobile/assets/branding/app/favicon.png`
- `apps/mobile/public/favicon.png`

### Group 2

- `apps/mobile/assets/illustrations/baybayin/gavino/a.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/VOWELS/Gavino Baybayin - A.png`

### Group 3

- `apps/mobile/assets/illustrations/baybayin/gavino/ba.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/B/Gavino Baybayin - BA.png`

### Group 4

- `apps/mobile/assets/illustrations/baybayin/gavino/da_ra.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/D_R/Gavino Baybayin - DRA.png`

### Group 5

- `apps/mobile/assets/illustrations/baybayin/gavino/e_i.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/VOWELS/Gavino Baybayin - IE.png`

### Group 6

- `apps/mobile/assets/illustrations/baybayin/gavino/ga.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/G/Gavino Baybayin - GA.png`

### Group 7

- `apps/mobile/assets/illustrations/baybayin/gavino/ha.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/H/Gavino Baybayin - HA.png`

### Group 8

- `apps/mobile/assets/illustrations/baybayin/gavino/ka.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/K/Gavino Baybayin - KA.png`

### Group 9

- `apps/mobile/assets/illustrations/baybayin/gavino/la.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/L/Gavino Baybayin - LA.png`

### Group 10

- `apps/mobile/assets/illustrations/baybayin/gavino/ma.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/M/Gavino Baybayin - MA.png`

### Group 11

- `apps/mobile/assets/illustrations/baybayin/gavino/na.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/N/Gavino Baybayin - NA.png`

### Group 12

- `apps/mobile/assets/illustrations/baybayin/gavino/nga.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/NG/Gavino Baybayin - NGA.png`

### Group 13

- `apps/mobile/assets/illustrations/baybayin/gavino/o_u.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/VOWELS/Gavino Baybayin - OU.png`

### Group 14

- `apps/mobile/assets/illustrations/baybayin/gavino/pa.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/P/Gavino Baybayin - PA.png`

### Group 15

- `apps/mobile/assets/illustrations/baybayin/gavino/sa.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/S/Gavino Baybayin - SA.png`

### Group 16

- `apps/mobile/assets/illustrations/baybayin/gavino/ta.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/T/Gavino Baybayin - TA.png`

### Group 17

- `apps/mobile/assets/illustrations/baybayin/gavino/wa.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/W/Gavino Baybayin - WA.png`

### Group 18

- `apps/mobile/assets/illustrations/baybayin/gavino/ya.png`
- `Gavino_Baybayin_PNG/Gavino Baybayin Characters SMALL/Y/Gavino Baybayin - YA.png`

### Group 19

- `apps/mobile/assets/illustrations/baybayin/guides-1024/a.png`
- `baybayin_guides_1024/a.png`

### Group 20

- `apps/mobile/assets/illustrations/baybayin/guides-1024/b.png`
- `baybayin_guides_1024/b.png`

### Group 21

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ba.png`
- `baybayin_guides_1024/ba.png`

### Group 22

- `apps/mobile/assets/illustrations/baybayin/guides-1024/be_bi.png`
- `baybayin_guides_1024/be_bi.png`

### Group 23

- `apps/mobile/assets/illustrations/baybayin/guides-1024/bo_bu.png`
- `baybayin_guides_1024/bo_bu.png`

### Group 24

- `apps/mobile/assets/illustrations/baybayin/guides-1024/d.png`
- `baybayin_guides_1024/d.png`

### Group 25

- `apps/mobile/assets/illustrations/baybayin/guides-1024/da_ra.png`
- `baybayin_guides_1024/da_ra.png`

### Group 26

- `apps/mobile/assets/illustrations/baybayin/guides-1024/de_di.png`
- `baybayin_guides_1024/de_di.png`

### Group 27

- `apps/mobile/assets/illustrations/baybayin/guides-1024/do_du.png`
- `baybayin_guides_1024/do_du.png`

### Group 28

- `apps/mobile/assets/illustrations/baybayin/guides-1024/e_i.png`
- `baybayin_guides_1024/e_i.png`

### Group 29

- `apps/mobile/assets/illustrations/baybayin/guides-1024/g.png`
- `baybayin_guides_1024/g.png`

### Group 30

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ga.png`
- `baybayin_guides_1024/ga.png`

### Group 31

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ge_gi.png`
- `baybayin_guides_1024/ge_gi.png`

### Group 32

- `apps/mobile/assets/illustrations/baybayin/guides-1024/go_gu.png`
- `baybayin_guides_1024/go_gu.png`

### Group 33

- `apps/mobile/assets/illustrations/baybayin/guides-1024/h.png`
- `baybayin_guides_1024/h.png`

### Group 34

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ha.png`
- `baybayin_guides_1024/ha.png`

### Group 35

- `apps/mobile/assets/illustrations/baybayin/guides-1024/he_hi.png`
- `baybayin_guides_1024/he_hi.png`

### Group 36

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ho_hu.png`
- `baybayin_guides_1024/ho_hu.png`

### Group 37

- `apps/mobile/assets/illustrations/baybayin/guides-1024/k.png`
- `baybayin_guides_1024/k.png`

### Group 38

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ka.png`
- `baybayin_guides_1024/ka.png`

### Group 39

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ke_ki.png`
- `baybayin_guides_1024/ke_ki.png`

### Group 40

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ko_ku.png`
- `baybayin_guides_1024/ko_ku.png`

### Group 41

- `apps/mobile/assets/illustrations/baybayin/guides-1024/l.png`
- `baybayin_guides_1024/l.png`

### Group 42

- `apps/mobile/assets/illustrations/baybayin/guides-1024/la.png`
- `baybayin_guides_1024/la.png`

### Group 43

- `apps/mobile/assets/illustrations/baybayin/guides-1024/le_li.png`
- `baybayin_guides_1024/le_li.png`

### Group 44

- `apps/mobile/assets/illustrations/baybayin/guides-1024/lo_lu.png`
- `baybayin_guides_1024/lo_lu.png`

### Group 45

- `apps/mobile/assets/illustrations/baybayin/guides-1024/m.png`
- `baybayin_guides_1024/m.png`

### Group 46

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ma.png`
- `baybayin_guides_1024/ma.png`

### Group 47

- `apps/mobile/assets/illustrations/baybayin/guides-1024/me_mi.png`
- `baybayin_guides_1024/me_mi.png`

### Group 48

- `apps/mobile/assets/illustrations/baybayin/guides-1024/mo_mu.png`
- `baybayin_guides_1024/mo_mu.png`

### Group 49

- `apps/mobile/assets/illustrations/baybayin/guides-1024/n.png`
- `baybayin_guides_1024/n.png`

### Group 50

- `apps/mobile/assets/illustrations/baybayin/guides-1024/na.png`
- `baybayin_guides_1024/na.png`

### Group 51

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ne_ni.png`
- `baybayin_guides_1024/ne_ni.png`

### Group 52

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ng.png`
- `baybayin_guides_1024/ng.png`

### Group 53

- `apps/mobile/assets/illustrations/baybayin/guides-1024/nga.png`
- `baybayin_guides_1024/nga.png`

### Group 54

- `apps/mobile/assets/illustrations/baybayin/guides-1024/nge_ngi.png`
- `baybayin_guides_1024/nge_ngi.png`

### Group 55

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ngo_ngu.png`
- `baybayin_guides_1024/ngo_ngu.png`

### Group 56

- `apps/mobile/assets/illustrations/baybayin/guides-1024/no_nu.png`
- `baybayin_guides_1024/no_nu.png`

### Group 57

- `apps/mobile/assets/illustrations/baybayin/guides-1024/o_u.png`
- `baybayin_guides_1024/o_u.png`

### Group 58

- `apps/mobile/assets/illustrations/baybayin/guides-1024/p.png`
- `baybayin_guides_1024/p.png`

### Group 59

- `apps/mobile/assets/illustrations/baybayin/guides-1024/pa.png`
- `baybayin_guides_1024/pa.png`

### Group 60

- `apps/mobile/assets/illustrations/baybayin/guides-1024/pe_pi.png`
- `baybayin_guides_1024/pe_pi.png`

### Group 61

- `apps/mobile/assets/illustrations/baybayin/guides-1024/po_pu.png`
- `baybayin_guides_1024/po_pu.png`

### Group 62

- `apps/mobile/assets/illustrations/baybayin/guides-1024/r.png`
- `baybayin_guides_1024/r.png`

### Group 63

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ra.png`
- `baybayin_guides_1024/ra.png`

### Group 64

- `apps/mobile/assets/illustrations/baybayin/guides-1024/re_ri.png`
- `baybayin_guides_1024/re_ri.png`

### Group 65

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ro_ru.png`
- `baybayin_guides_1024/ro_ru.png`

### Group 66

- `apps/mobile/assets/illustrations/baybayin/guides-1024/s.png`
- `baybayin_guides_1024/s.png`

### Group 67

- `apps/mobile/assets/illustrations/baybayin/guides-1024/sa.png`
- `baybayin_guides_1024/sa.png`

### Group 68

- `apps/mobile/assets/illustrations/baybayin/guides-1024/se_si.png`
- `baybayin_guides_1024/se_si.png`

### Group 69

- `apps/mobile/assets/illustrations/baybayin/guides-1024/selected_sources.json`
- `baybayin_guides_1024/selected_sources.json`

### Group 70

- `apps/mobile/assets/illustrations/baybayin/guides-1024/so_su.png`
- `baybayin_guides_1024/so_su.png`

### Group 71

- `apps/mobile/assets/illustrations/baybayin/guides-1024/t.png`
- `baybayin_guides_1024/t.png`

### Group 72

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ta.png`
- `baybayin_guides_1024/ta.png`

### Group 73

- `apps/mobile/assets/illustrations/baybayin/guides-1024/te_ti.png`
- `baybayin_guides_1024/te_ti.png`

### Group 74

- `apps/mobile/assets/illustrations/baybayin/guides-1024/to_tu.png`
- `baybayin_guides_1024/to_tu.png`

### Group 75

- `apps/mobile/assets/illustrations/baybayin/guides-1024/w.png`
- `baybayin_guides_1024/w.png`

### Group 76

- `apps/mobile/assets/illustrations/baybayin/guides-1024/wa.png`
- `baybayin_guides_1024/wa.png`

### Group 77

- `apps/mobile/assets/illustrations/baybayin/guides-1024/we_wi.png`
- `baybayin_guides_1024/we_wi.png`

### Group 78

- `apps/mobile/assets/illustrations/baybayin/guides-1024/wo_wu.png`
- `baybayin_guides_1024/wo_wu.png`

### Group 79

- `apps/mobile/assets/illustrations/baybayin/guides-1024/y.png`
- `baybayin_guides_1024/y.png`

### Group 80

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ya.png`
- `baybayin_guides_1024/ya.png`

### Group 81

- `apps/mobile/assets/illustrations/baybayin/guides-1024/ye_yi.png`
- `baybayin_guides_1024/ye_yi.png`

### Group 82

- `apps/mobile/assets/illustrations/baybayin/guides-1024/yo_yu.png`
- `baybayin_guides_1024/yo_yu.png`

### Group 83

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/inspection.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/inspection.json`

### Group 84

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/before/ml/bayaActiveModel.json`
- `ml/rollback/models/baya/EfficientNetB0_model_onnx_contract.json`

### Group 85

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/class-mapping.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/class-mapping.json`
- `ml/rollback/fixtures/bilstm-v1.1/class-mapping.json`

### Group 86

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/notebook-audit.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/notebook-audit.json`
- `ml/rollback/fixtures/bilstm-v1.1/notebook-audit.json`

### Group 87

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/alpha-gray/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/alpha-gray/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/alpha-gray/input.json`

### Group 88

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/alpha-gray/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/blank-image/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/degenerate-duration/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/exact-512/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/kudlit-above/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/kudlit-below/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/many-strokes-downsampling/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/multi-stroke/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/narrow-tall/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/over-512/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/short-sequence/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/single-stroke/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/tiny-edge/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/wide/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/zero-duration/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/alpha-gray/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/blank-image/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/degenerate-duration/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/exact-512/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/kudlit-above/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/kudlit-below/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/many-strokes-downsampling/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/multi-stroke/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/narrow-tall/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/over-512/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/short-sequence/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/single-stroke/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/tiny-edge/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/wide/shape.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/zero-duration/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/alpha-gray/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/blank-image/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/degenerate-duration/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/exact-512/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/kudlit-above/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/kudlit-below/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/many-strokes-downsampling/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/multi-stroke/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/narrow-tall/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/over-512/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/short-sequence/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/single-stroke/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/tiny-edge/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/wide/shape.json`
- `ml/rollback/fixtures/bilstm-v1.1/zero-duration/shape.json`

### Group 89

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/alpha-gray/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/alpha-gray/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/alpha-gray/source.png`

### Group 90

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/blank-image/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/blank-image/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/blank-image/input.json`

### Group 91

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/blank-image/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/degenerate-duration/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/exact-512/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/many-strokes-downsampling/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/over-512/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/short-sequence/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/zero-duration/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/blank-image/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/degenerate-duration/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/exact-512/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/many-strokes-downsampling/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/over-512/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/short-sequence/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/zero-duration/source.png`
- `ml/deployment/onnx/artifacts/custom-cnn8-1.1/fixture-validation.png`
- `ml/deployment/onnx/artifacts/efficientnetb0-model/preprocessing-check.png`
- `ml/rollback/fixtures/bilstm-v1.1/blank-image/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/degenerate-duration/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/exact-512/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/many-strokes-downsampling/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/over-512/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/short-sequence/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/zero-duration/source.png`

### Group 92

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/degenerate-duration/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/degenerate-duration/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/degenerate-duration/input.json`

### Group 93

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/exact-512/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/exact-512/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/exact-512/input.json`

### Group 94

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/kudlit-above/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/kudlit-above/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/kudlit-above/input.json`

### Group 95

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/kudlit-above/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/kudlit-above/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/kudlit-above/source.png`

### Group 96

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/kudlit-below/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/kudlit-below/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/kudlit-below/input.json`

### Group 97

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/kudlit-below/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/kudlit-below/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/kudlit-below/source.png`

### Group 98

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/many-strokes-downsampling/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/many-strokes-downsampling/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/many-strokes-downsampling/input.json`

### Group 99

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/multi-stroke/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/multi-stroke/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/multi-stroke/input.json`

### Group 100

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/multi-stroke/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/multi-stroke/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/multi-stroke/source.png`

### Group 101

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/narrow-tall/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/narrow-tall/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/narrow-tall/input.json`

### Group 102

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/narrow-tall/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/narrow-tall/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/narrow-tall/source.png`

### Group 103

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/over-512/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/over-512/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/over-512/input.json`

### Group 104

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/short-sequence/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/short-sequence/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/short-sequence/input.json`

### Group 105

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/single-stroke/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/single-stroke/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/single-stroke/input.json`

### Group 106

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/single-stroke/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/single-stroke/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/single-stroke/source.png`

### Group 107

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/tiny-edge/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/tiny-edge/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/tiny-edge/input.json`

### Group 108

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/tiny-edge/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/tiny-edge/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/tiny-edge/source.png`

### Group 109

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/wide/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/wide/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/wide/input.json`

### Group 110

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/wide/source.png`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/wide/source.png`
- `ml/rollback/fixtures/bilstm-v1.1/wide/source.png`

### Group 111

- `ml/deployment/onnx/artifacts/bilstm-v1.1-replacement/fixtures/zero-duration/input.json`
- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/zero-duration/input.json`
- `ml/rollback/fixtures/bilstm-v1.1/zero-duration/input.json`

### Group 112

- `ml/deployment/onnx/artifacts/bilstm-v1.1-reproduction/fixtures/real-ka.json`
- `ml/diagnostics/captures/baya-capture-ka-2026-09-28T12-51-57-996Z.json`
- `ml/rollback/fixtures/bilstm-v1.1/real-ka.json`

### Group 113

- `ml/deployment/onnx/artifacts/custom-cnn-1.3/baya-capture-ka-2026-09-28T12-51-57-996Z.png`
- `ml/deployment/onnx/artifacts/custom-cnn8-1.1/baya-capture-ka-2026-09-28T12-51-57-996Z.png`
- `ml/deployment/onnx/artifacts/efficientnetb0-model/capture-preprocessing.png`
- `ml/deployment/onnx/artifacts/external-v2/baya-capture-ka-2026-09-28T12-51-57-996Z.png`

### Group 114

- `ml/deployment/onnx/artifacts/custom-cnn-1.3/preserved-assets.json`
- `ml/deployment/onnx/artifacts/custom-cnn8-1.1/preserved-assets.json`

### Group 115

- `ml/deployment/onnx/artifacts/custom-cnn-1.3/starting-active.json`
- `ml/deployment/onnx/artifacts/custom-cnn8-1.1/starting-active.json`
- `ml/rollback/models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2_onnx_contract.json`

### Group 116

- `ml/deployment/onnx/artifacts/efficientnetb0-model/labels.json`
- `ml/deployment/onnx/artifacts/resnet18-1.0/BAYA_ResNet18_1.0_labels.json`
- `ml/rollback/models/baya/BAYA_ResNet18_1.0_labels.json`
- `ml/rollback/models/baya/Baybayin_CustomCNN8_1.1_labels.json`
- `ml/rollback/models/baya/Baybayin_EfficientNetB0_BiLSTM_labels_1.1.json`
- `ml/rollback/models/baya/Baybayin_EfficientNetB0_ExternalFirst_v2_labels.json`
- `ml/rollback/models/baya/EfficientNetB0_model_labels.json`

### Group 117

- `ml/deployment/onnx/artifacts/imagenet-finetune-1.0/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0.onnx`
- `ml/rollback/models/baya/EfficientNetB0_model.onnx`

### Group 118

- `ml/deployment/onnx/artifacts/imagenet-finetune-1.0/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0_onnx_contract.json`
- `ml/rollback/models/baya/Baybayin_EfficientNetB0_imagenet_finetuned_finetune_1.0_onnx_contract.json`

### Group 119

- `ml/deployment/onnx/artifacts/resnet18-1.0/BAYA_ResNet18_1.0.onnx`
- `ml/rollback/models/baya/BAYA_ResNet18_1.0.onnx`
