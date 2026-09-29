import { evaluateWriting, type StrokeData, type WritingAttempt } from './writingEngine';

/** Swap this adapter for on-device or hosted recognition without changing the canvas or screen. */
export interface WritingRecognitionService {
  assess(characterId: string, strokes: StrokeData): Promise<WritingAttempt | null>;
}

/** Offline shape comparison; this does not identify handwritten characters. */
export const localWritingRecognitionService: WritingRecognitionService = {
  async assess(characterId, strokes) {
    return evaluateWriting(characterId, strokes);
  },
};
