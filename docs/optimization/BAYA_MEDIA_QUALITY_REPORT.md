# Media quality

All 50 mascot frames retain 1024×1024 dimensions and identical decoded RGBA bytes, including fully transparent pixel colors (`exact=True`). No redraw, crop, resize, palette reduction, motion timing change or lossy encoding was deployed. PNG originals remain authoritative and native builds retain them. New web frames total 10,949,292 bytes, versus 16,931,436; savings 35.33%.

The existing 60 ms frame cadence, rests, one-shot greeting, phase controls, reduced-motion hook, full/upper-body layout and image preload behavior are unchanged. Both sequences have 25 frames. A sequence is 1,500 ms; ambient is 9,600 ms including rests; idle is 8,100 ms; greeting is 1,801 ms including its final rest step. There are still 50 frame requests in complete offline installation. Full decoded RGBA for all frames is nominally 200 MiB; this storage optimization does not reduce that memory requirement or prove smoother animation.

Lossless sprite trials: wave 5,755,568 bytes, blink 5,603,676; each 5120×5120 canvas is 100 MiB decoded and their combined compressed size exceeds the adopted sequences. Animated WebP trials: wave 4,663,670, blink 4,615,150; smaller, but would need a different player to preserve rests, phase control and reduced-motion behavior. Not adopted without that validation. Existing motion is not equivalent to a single transform, so no transform substitution was made.

Seven representative illustrations/photos/frames were benchmarked as optimized PNG, lossless WebP, lossy WebP and AVIF (32 total candidates including animation containers). See the table and JSON. No lossy candidate was deployed, and no Baybayin reference was changed. Lossy metric similarity is not educational validation. Original image dimensions remain intact for high-density/zoom use. Photographs/artwork keep existing attribution and permission metadata.

Visual inspection covered the optimized resting mascot, Be/Bi guide (including its upper kudlit), and before/after 1280×800 story screens plus optimized 844×390 and 390×844 screens. Appearance/layout is consistent; screenshots can capture different animation phases. The lesson's 'Wala pang larawang magagamit' illustration placeholder is present in both builds and is not introduced by this change. Screenshots are in `browser/`. All 154 cached raster images decoded successfully offline in Chromium; both original and optimized mascot bytes were independently compared by Pillow. Physical native/Safari/Firefox visual validation remains unperformed.

Audio was already optimized before this work: 69 integrated AAC/M4A files, 1,534,044 bytes. All deployed bytes and mappings are unchanged. The existing `scripts/audio/process_audio.py` and `docs/audio/` contain 87-source benchmarks for Opus 24/32/40 kbps and AAC 48/64 kbps; those earlier savings are not credited here. All 69 clips decoded offline; Ba, Be and Bi also played to the ended event offline in the forced-WASM test. This verifies browser playback, not human listening or linguistic accuracy. Existing human listening sign-off remains pending; no further transcoding was accepted without it. Original recordings remain unchanged and outside deployment.

## Format trials (experimental; not deployed)

| Source | Format/settings | Original bytes | Candidate bytes | Exact RGBA |
| --- | --- | --- | --- | --- |
| apps/mobile/assets/branding/baya/idle/frame-000.png | PNG {'optimize': True} | 338033 | 300797 | True |
| apps/mobile/assets/branding/baya/idle/frame-000.png | WEBP {'lossless': True, 'exact': True, 'method': 6} | 338033 | 218958 | True |
| apps/mobile/assets/branding/baya/idle/frame-000.png | WEBP {'quality': 85, 'method': 6} | 338033 | 48488 | False |
| apps/mobile/assets/branding/baya/idle/frame-000.png | AVIF {'quality': 85, 'speed': 6} | 338033 | 41314 | False |
| apps/mobile/assets/illustrations/baybayin/gavino/ba.png | PNG {'optimize': True} | 6629 | 8760 | True |
| apps/mobile/assets/illustrations/baybayin/gavino/ba.png | WEBP {'lossless': True, 'exact': True, 'method': 6} | 6629 | 3126 | True |
| apps/mobile/assets/illustrations/baybayin/gavino/ba.png | WEBP {'quality': 85, 'method': 6} | 6629 | 3824 | False |
| apps/mobile/assets/illustrations/baybayin/gavino/ba.png | AVIF {'quality': 85, 'speed': 6} | 6629 | 4503 | False |
| apps/mobile/assets/illustrations/baybayin/guides-1024/be_bi.png | PNG {'optimize': True} | 53390 | 51510 | True |
| apps/mobile/assets/illustrations/baybayin/guides-1024/be_bi.png | WEBP {'lossless': True, 'exact': True, 'method': 6} | 53390 | 26008 | True |
| apps/mobile/assets/illustrations/baybayin/guides-1024/be_bi.png | WEBP {'quality': 85, 'method': 6} | 53390 | 25118 | False |
| apps/mobile/assets/illustrations/baybayin/guides-1024/be_bi.png | AVIF {'quality': 85, 'speed': 6} | 53390 | 26711 | False |
| apps/mobile/assets/storybook/acknowledgements/baybayin_buhayin_logo.jpg | PNG {'optimize': True} | 81951 | 905043 | True |
| apps/mobile/assets/storybook/acknowledgements/baybayin_buhayin_logo.jpg | WEBP {'lossless': True, 'exact': True, 'method': 6} | 81951 | 584296 | True |
| apps/mobile/assets/storybook/acknowledgements/baybayin_buhayin_logo.jpg | WEBP {'quality': 85, 'method': 6} | 81951 | 72962 | False |
| apps/mobile/assets/storybook/acknowledgements/baybayin_buhayin_logo.jpg | AVIF {'quality': 85, 'speed': 6} | 81951 | 81957 | False |
| apps/mobile/assets/storybook/acknowledgements/baybayin_creativity_workshops_classes_logo.jpg | PNG {'optimize': True} | 781459 | 6413197 | True |
| apps/mobile/assets/storybook/acknowledgements/baybayin_creativity_workshops_classes_logo.jpg | WEBP {'lossless': True, 'exact': True, 'method': 6} | 781459 | 4385832 | True |
| apps/mobile/assets/storybook/acknowledgements/baybayin_creativity_workshops_classes_logo.jpg | WEBP {'quality': 85, 'method': 6} | 781459 | 716912 | False |
| apps/mobile/assets/storybook/acknowledgements/baybayin_creativity_workshops_classes_logo.jpg | AVIF {'quality': 85, 'speed': 6} | 781459 | 766787 | False |
| apps/mobile/assets/storybook/acknowledgements/ms-mini-gavino.jpg | PNG {'optimize': True} | 32157 | 239934 | True |
| apps/mobile/assets/storybook/acknowledgements/ms-mini-gavino.jpg | WEBP {'lossless': True, 'exact': True, 'method': 6} | 32157 | 168670 | True |
| apps/mobile/assets/storybook/acknowledgements/ms-mini-gavino.jpg | WEBP {'quality': 85, 'method': 6} | 32157 | 24508 | False |
| apps/mobile/assets/storybook/acknowledgements/ms-mini-gavino.jpg | AVIF {'quality': 85, 'speed': 6} | 32157 | 29778 | False |
| apps/mobile/assets/storybook/bayani-real/bayani_pic.jpg | PNG {'optimize': True} | 133361 | 791168 | True |
| apps/mobile/assets/storybook/bayani-real/bayani_pic.jpg | WEBP {'lossless': True, 'exact': True, 'method': 6} | 133361 | 473666 | True |
| apps/mobile/assets/storybook/bayani-real/bayani_pic.jpg | WEBP {'quality': 85, 'method': 6} | 133361 | 70802 | False |
| apps/mobile/assets/storybook/bayani-real/bayani_pic.jpg | AVIF {'quality': 85, 'speed': 6} | 133361 | 83284 | False |
