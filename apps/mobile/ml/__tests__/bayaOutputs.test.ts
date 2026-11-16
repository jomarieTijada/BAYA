import { decodeSpatialHeads, expectedAuxiliary, softmax, type SpatialHeads } from '../bayaOutputs';
import { BAYA_CLASS_LABELS, BAYA_BASE_LABELS, BAYA_MODIFIER_LABELS } from '../bayaClassLabels';

function heads(label = 'be_bi'): SpatialHeads {
  const expected = expectedAuxiliary(label);
  const logits = (length: number, index: number) => { const v = new Float32Array(length); v[index] = 15; return v; };
  return { class_logits: logits(63, BAYA_CLASS_LABELS.indexOf(label)), base_logits: logits(18, BAYA_BASE_LABELS.indexOf(expected.base)),
    modifier_logits: logits(5, BAYA_MODIFIER_LABELS.indexOf(expected.modifier)),
    kudlit_xy: new Float32Array([.4, .2]), body_bbox: new Float32Array([.1, .3, .8, .9]) };
}
it.each(BAYA_CLASS_LABELS)('decodes exact training indices for %s', label => {
  const result = decodeSpatialHeads(heads(label));
  expect(result.primary.label).toBe(label);
  expect(result.primary.classIndex).toBe(BAYA_CLASS_LABELS.indexOf(label));
  expect(result.consistency).toEqual({ baseMatches: true, modifierMatches: true });
  expect(result.kudlit !== null).toBe(['above', 'below', 'virama'].includes(expectedAuxiliary(label).modifier));
});
it('keeps the primary prediction when auxiliary heads disagree', () => {
  const h = heads('ba'); h.modifier_logits[1] = 30; h.base_logits[2] = 30;
  const result = decodeSpatialHeads(h);
  expect(result.primary.label).toBe('ba'); expect(result.kudlit).toBeNull();
  expect(result.consistency).toEqual({ baseMatches: false, modifierMatches: false });
});
it('computes stable softmax without clipping logits', () => {
  const p = softmax(new Float32Array([10000, 9999, -10000]));
  expect(p[0]).toBeCloseTo(.7310586); expect(p[0] + p[1] + p[2]).toBeCloseTo(1);
});
it.each([NaN, Infinity, -Infinity])('rejects nonfinite output %s', value => {
  const h = heads(); h.class_logits[0] = value;
  expect(() => decodeSpatialHeads(h)).toThrow();
});
it('rejects malformed tensors and spatial bounds', () => {
  expect(() => decodeSpatialHeads({ ...heads(), base_logits: new Float32Array(17) })).toThrow();
  expect(() => decodeSpatialHeads({ ...heads(), kudlit_xy: new Float32Array([-1, .5]) })).toThrow();
  expect(() => decodeSpatialHeads({ ...heads(), body_bbox: new Float32Array([.8, .1, .2, .9]) })).toThrow();
});
