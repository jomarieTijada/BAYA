# Historical inference adapter

`bayaModel.web.ts.txt` is the pre-cleanup multi-input loader, retained as research
source for the EfficientNet and Custom CNN comparison scripts. The scripts
transpile it explicitly; it is not part of the mobile TypeScript or web bundle.

Production inference uses `apps/mobile/ml/bayaModel.web.ts` with the active
ResNet18 image-only contract. Historical sequence fixtures are in
`../fixtures/bilstm-v1.1`. Keep their original values for reproducibility.
