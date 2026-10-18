import { SpeechBubbleColors } from '../../../ui/speechBubbleStyles';
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { BayaWritingGuide } from '../BayaWritingGuide';
import { WritingNavigation } from '../WritingNavigation';
import { ActivityHeader } from '../../activity/ActivityHeader';
import { WritingToolbar } from '../WritingToolbar';
import { writingTopics } from '../../../../content/writingLessonData';
import { writingClassId } from '../../../../content/writingMastery';
import { WritingPracticeScreen } from '../WritingPracticeScreen';

const masteryLabel = (n: number) => ["Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.", "Isa sa dalawang bituin ang nakuha.", "Nakuha na ang dalawang bituin. Maaari nang magpatuloy."][n];
const mockRecognizeWriting = jest.fn();
const mockRecordAttempt = jest.fn();
const mockDismissTo = jest.fn();
let mockStrokeData: any;
let mockViewport = { width: 1440, height: 900 };

jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: mockDismissTo, push: jest.fn(), setParams: jest.fn() }),
}));
jest.mock('../../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => mockViewport,
}));
// Motion has dedicated component tests; keep workflow tests deterministic.
jest.mock('../../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => true }));
jest.mock('../../../../ml/writingRecognition', () => ({
  recognizeWriting: (...args: unknown[]) => mockRecognizeWriting(...args),
}));
jest.mock('../../../../database/services/localLearnerService', () => ({
  localLearnerService: {
    recordWritingAttempt: (...args: unknown[]) => mockRecordAttempt(...args),
    completeTopic: jest.fn(async () => undefined),
  },
}));
jest.mock('../../LearnerAppShell', () => ({
  LearnerAppShell: ({ children, footer, header }: { children: React.ReactNode; footer?: React.ReactNode; header?: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{header}{children}{footer}</View>;
  },
}));
jest.mock('../../activity/ActivityHeader', () => ({ ActivityHeader: ({ onBack }: { onBack: () => void }) => { const { Pressable, Text } = jest.requireActual('react-native'); return <Pressable accessibilityLabel="Back" onPress={onBack}><Text>Bumalik</Text></Pressable>; } }));
jest.mock('../CharacterReferenceCard', () => ({ CharacterReferenceCard: ({ exercise }: { exercise: { characterId: string } }) => {
  const { Text } = jest.requireActual('react-native');
  return <Text testID="test-target">{exercise.characterId}</Text>;
} }));
jest.mock('../WritingToolbar', () => ({ WritingToolbar: ({ onClear, onUndo, canEdit }: any) => {
  const { Pressable, Text, View } = jest.requireActual('react-native');
  return <View><Pressable disabled={!canEdit} accessibilityLabel="Clear test canvas" onPress={onClear}><Text>Clear</Text></Pressable><Pressable disabled={!canEdit} accessibilityLabel="Undo test canvas" onPress={onUndo}><Text>Undo</Text></Pressable></View>;
} }));
jest.mock('../../../branding/BayaMascot', () => ({
  BayaMascot: ({ state }: { state: string }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text testID="test-baya-mascot">{state}</Text>;
  },
}));
jest.mock('../WritingCanvas', () => ({
  WritingCanvas: ({ onChange, onSizeChange, strokes }: {
    onChange: (strokes: unknown) => void;
    onSizeChange?: (size: { width: number; height: number }) => void;
    strokes: unknown[];
  }) => {
    const { Pressable, Text, View } = jest.requireActual('react-native');
    return <View><Text testID="test-stroke-count">{strokes.length}</Text><Pressable accessibilityLabel="Draw a test stroke" onPress={() => {
      onSizeChange?.({ width: 200, height: 100 });
      onChange(mockStrokeData);
    }}><Text>Drawing canvas</Text></Pressable></View>;
  },
}));

const modelPredictions = [
  { classIndex: 0, label: 'a', probability: 0.976 },
  { classIndex: 27, label: 'ma', probability: 0.016 },
  { classIndex: 28, label: 'me_mi', probability: 0.004 },
];

describe('Module 3 single-action BAYA recognition', () => {
  const originalPlatform = Platform.OS;
  beforeAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' }));
  afterAll(() => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform }));
  afterEach(() => jest.restoreAllMocks());
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    mockStrokeData = [[{ x: 0.1, y: 0.1, t: 1000 }, { x: 0.4, y: 0.5, t: 1020 }, { x: 0.8, y: 0.7, t: 1050 }]];
    mockViewport = { width: 1440, height: 900 };
    mockRecordAttempt.mockResolvedValue(undefined);
    mockRecognizeWriting.mockResolvedValue(modelPredictions);
  });

  it('starts without a prediction or inference and renders only Suriin as the check action', () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    expect(mockRecognizeWriting).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Suriin ang isinulat')).toBeTruthy();
    expect(screen.queryByText('Kilalanin gamit ang BAYA')).toBeNull();
    expect(screen.queryByText('Pagkilala ng BAYA')).toBeNull();
    expect(screen.getByText('Magsulat na!')).toBeTruthy();
  });

  it('runs one inference and shows the ranked top three with correctness separate from confidence', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));

    await waitFor(() => expect(mockRecognizeWriting).toHaveBeenCalledTimes(1));
    expect(mockRecognizeWriting.mock.calls[0][2]).toBe(3);
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class').props.children).toBe('A'));
    expect(screen.getByTestId('baya-confidence-percentage').props.children).toBe('97.6%');
    expect(screen.queryByText('Kumpiyansa ng BAYA')).toBeNull();
    expect(screen.queryByText('Pagkilala ng BAYA')).toBeNull();
    expect(screen.queryByText('Mataas ang kumpiyansa ng BAYA!')).toBeNull();
    expect(screen.getByTestId('baya-match-1')).toBeTruthy();
    expect(screen.getByTestId('baya-match-2')).toBeTruthy();
    expect(screen.getByTestId('baya-match-3')).toBeTruthy();
    expect(screen.getByText('Iba pang nasuri')).toBeTruthy();
    expect(screen.getByText('MA')).toBeTruthy();
    expect(screen.getByText('ME/MI')).toBeTruthy();
    expect(screen.getByText('1.6%')).toBeTruthy();
    expect(screen.getByText('0.4%')).toBeTruthy();
    expect(screen.getByText('Mahusay!')).toBeTruthy();
    expect(screen.queryByText('Suriin')).toBeNull();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
  });

  it('disables Suriin, shows textual loading in the bubble and button, and prevents a repeated request during inference', async () => {
    let finishInference!: (value: typeof modelPredictions) => void;
    mockRecognizeWriting.mockImplementation(() => new Promise((resolve) => { finishInference = resolve; }));
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));

    await waitFor(() => expect(mockRecognizeWriting).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Sinusuri ang sulat...')).toBeTruthy();
    expect(screen.getByText('Sinusuri...')).toBeTruthy();
    expect(screen.getByLabelText('Suriin ang isinulat').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    expect(mockRecognizeWriting).toHaveBeenCalledTimes(1);
    await act(async () => { finishInference(modelPredictions); });
    expect(screen.queryByText('Suriin')).toBeNull();
    expect(screen.getByLabelText('Back')).toBeTruthy();
  });

  it('animates the loading dots and stops them when analysis ends', () => {
    jest.useFakeTimers();
    try {
      const { rerender } = render(<BayaWritingGuide mascotSize={150} recognition={{ status: 'analyzing' }} targetClass="a" />);
      expect(screen.getByText('Sinusuri ang sulat...')).toBeTruthy();
      act(() => { jest.advanceTimersByTime(450); });
      expect(screen.getByText('Sinusuri ang sulat')).toBeTruthy();
      rerender(<BayaWritingGuide mascotSize={150} recognition={{ status: 'idle' }} targetClass="a" />);
      act(() => { jest.advanceTimersByTime(900); });
      expect(screen.getByText('Magsulat na!')).toBeTruthy();
      expect(screen.queryByText(/Sinusuri ang sulat/)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows an empty-canvas message and never starts the model for insufficient drawing', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    expect(screen.getByLabelText('Suriin ang isinulat').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await act(async () => screen.UNSAFE_getByType(WritingNavigation).props.onCheck());
    await waitFor(() => expect(screen.getByText('Magsulat muna sa kahon bago suriin.')).toBeTruthy());
    expect(mockRecognizeWriting).not.toHaveBeenCalled();
    expect(screen.queryByText(/^(0%|NaN|Unknown)$/)).toBeNull();
  });

  it('shows a friendly bubble on inference failure and logs technical detail only in development', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockRecognizeWriting.mockRejectedValue(new Error('private ONNX detail'));
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByText('Hindi masuri ni BAYA ang sulat. Subukan muli.')).toBeTruthy());
    expect(screen.queryByText('private ONNX detail')).toBeNull();
    expect(screen.getByLabelText('Ulitin ang pagsulat')).toBeTruthy();
    expect(screen.queryByLabelText('Susunod na simbolo')).toBeNull();
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });

  it('does not treat a high-confidence wrong class as a match', async () => {
    mockRecognizeWriting.mockResolvedValue([{ classIndex: 27, label: 'ma', probability: 0.97 }]);
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class').props.children).toBe('MA'));
    expect(screen.getByText('Malapit na!')).toBeTruthy();
    expect(screen.queryByText('Ibang simbolo ang nakita ni BAYA. Subukan nating muli.')).toBeNull();
    expect(screen.queryByText('Subukan nating tingnan muli ang sulat.')).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe(SpeechBubbleColors.border);
    expect(screen.getByTestId('test-baya-mascot').props.children).toBe('ambient');
  });

  it('shows a compact retry result in the shared cream bubble for wrong DA/RA at 99.3% confidence', () => {
    render(<BayaWritingGuide mascotSize={240} recognition={{ status: 'success', predictions: [
      { classIndex: 7, label: 'de_di', probability: 0.993 },
      { classIndex: 6, label: 'da_ra', probability: 0.005 },
      { classIndex: 53, label: 'te_ti', probability: 0.001 },
    ] }} targetClass="da_ra" />);
    expect(screen.getByTestId('baya-predicted-class').props.children).toBe('DE/DI');
    expect(screen.getByTestId('baya-confidence-percentage').props.children).toBe('99.3%');
    expect(screen.getByText('DA/RA')).toBeTruthy();
    expect(screen.getByText('TE/TI')).toBeTruthy();
    expect(screen.getByText('Malapit na!')).toBeTruthy();
    expect(screen.queryByText('Ibang simbolo ang nakita ni BAYA. Subukan nating muli.')).toBeNull();
    expect(screen.queryByText('Subukan nating tingnan muli ang sulat.')).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe(SpeechBubbleColors.border);
  });

  it('keeps long class names and percentages on one compact row in a narrow feedback column', () => {
    render(<BayaWritingGuide mascotSize={108} recognition={{ status: 'success', predictions: [
      { classIndex: 37, label: 'ngo_ngu', probability: 0.3 },
      { classIndex: 40, label: 'po_pu', probability: 0.296 },
      { classIndex: 53, label: 'te_ti', probability: 0.132 },
    ] }} targetClass="a" />);
    fireEvent(screen.getByTestId('baya-result-bubble'), 'layout', { nativeEvent: { layout: { width: 149 } } });

    const primaryLabel = screen.getByTestId('baya-predicted-class');
    expect(primaryLabel.props.children).toBe('NGO/NGU');
    expect(primaryLabel.props.numberOfLines).toBe(1);
    expect(StyleSheet.flatten(primaryLabel.props.style).fontSize).toBe(15);
    expect(StyleSheet.flatten(screen.getByTestId('baya-confidence-percentage').props.style).fontSize).toBe(13);
    expect(screen.getByTestId('baya-confidence-percentage').props.children).toBe('30.0%');
    expect(screen.getByText('Malapit na!')).toBeTruthy();
    expect(screen.queryByText('Subukan nating tingnan muli ang sulat.')).toBeNull();
    expect(screen.queryByText('Ibang simbolo ang nakita ni BAYA. Subukan nating muli.')).toBeNull();
  });

  it('renders correct BA ahead of PA and MA with green success text', async () => {
    mockRecognizeWriting.mockResolvedValue([
      { classIndex: 40, label: 'pa', probability: 0.014 },
      { classIndex: 27, label: 'ma', probability: 0.005 },
      { classIndex: 2, label: 'ba', probability: 0.978 },
    ]);
    render(<WritingPracticeScreen topicId="topic-3-2" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class').props.children).toBe('BA'));
    expect(screen.getByTestId('baya-confidence-percentage').props.children).toBe('97.8%');
    expect(within(screen.getByTestId('baya-match-2')).getByText('PA')).toBeTruthy();
    expect(within(screen.getByTestId('baya-match-3')).getByText('MA')).toBeTruthy();
    expect(screen.getByText('Mahusay!')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe(SpeechBubbleColors.border);
  });

  async function masterCurrent() {
    for (let i = 0; i < 2; i++) {
      if (i) fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
      fireEvent.press(screen.getByLabelText('Draw a test stroke'));
      fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
      await waitFor(() => expect(screen.getByLabelText(masteryLabel(i + 1))).toBeTruthy());
    }
  }

  it('Balik returns to the previous symbol and clears the current attempt', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    await masterCurrent();
    fireEvent.press(screen.getByLabelText('Susunod na simbolo'));
    expect(screen.getByTestId('test-target').props.children).toBe('e_i');
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class')).toBeTruthy());
    expect(screen.getByText('Bumalik')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.queryByTestId('baya-predicted-class')).toBeNull();
    expect(screen.getByTestId('test-target').props.children).toBe('a');
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(0);
    expect(screen.getByLabelText('Suriin ang isinulat')).toBeTruthy();
  });

  it('Ulitin returns to writing on the same target and clears strokes', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
    expect(screen.queryByTestId('baya-predicted-class')).toBeNull();
    expect(screen.getByTestId('test-target').props.children).toBe('a');
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(0);
    expect(screen.getByLabelText('Suriin ang isinulat')).toBeTruthy();
  });

  it('allows Susunod only after two saved valid results', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    await masterCurrent();
    fireEvent.press(screen.getByLabelText('Susunod na simbolo'));
    expect(screen.getByTestId('test-target').props.children).toBe('e_i');
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(0);
    expect(screen.getByLabelText('Suriin ang isinulat')).toBeTruthy();
  });

  it('does not let a stale retry empty the locked completed canvas', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByLabelText('Ulitin ang pagsulat')).toBeTruthy());
    const retry = screen.UNSAFE_getByType(WritingNavigation).props.onRetry;
    fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
    expect(screen.getByLabelText('Suriin ang isinulat').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByLabelText('Susunod na simbolo')).toBeTruthy());
    expect(screen.queryByLabelText('Ulitin ang pagsulat')).toBeNull();
    act(() => retry());
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(1);
    expect(screen.getByLabelText('Nakuha na ang dalawang bituin. Maaari nang magpatuloy.')).toBeTruthy();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(2);
  });

  it.each([[360, 780], [390, 844], [430, 932], [768, 1024], [1024, 768], [1366, 768], [1440, 900]])(
    'renders the same result at %ipx by %ipx', async (width, height) => {
      mockViewport = { width, height };
      render(<WritingPracticeScreen topicId="topic-3-1" />);
      fireEvent.press(screen.getByLabelText('Draw a test stroke'));
      fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
      await waitFor(() => expect(screen.getByTestId('baya-predicted-class').props.children).toBe('A'));
      expect(screen.queryByText('Kumpiyansa ng BAYA')).toBeNull();
      expect(screen.getByTestId('baya-confidence-percentage').props.children).toBe('97.6%');
      expect(screen.getByTestId('baya-match-3')).toBeTruthy();
      expect(screen.getByText('Mahusay!')).toBeTruthy();
      expect(screen.getByLabelText('Ulitin ang pagsulat')).toBeTruthy();
    },
  );

  it('requires Ulitin to start a fresh drawing after evaluation', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    expect(screen.getByTestId('baya-predicted-class')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    expect(screen.queryByTestId('baya-predicted-class')).toBeNull();
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(mockRecognizeWriting).toHaveBeenCalledTimes(2));
  });


  it.each([0.8, 0.800001, 0.799999, 0.7996])('gates a real screen evaluation at raw %s', async probability => {
    mockRecognizeWriting.mockResolvedValue([{ label: 'a', classIndex: 0, probability }]);
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class')).toBeTruthy());
    expect(screen.getByLabelText(masteryLabel(probability >= 0.8 ? 1 : 0))).toBeTruthy();
    expect(screen.getByText(probability >= 0.8 ? 'Mahusay!' : 'Malapit na!')).toBeTruthy();
    expect(screen.queryByLabelText('Susunod na simbolo')).toBeNull();
    expect(mockRecordAttempt).toHaveBeenCalledWith('topic-3-1', expect.objectContaining({
      characterId: 'a', recognizedClassId: 'a', confidence: probability, result: probability >= 0.8 ? 'valid' : 'invalid', attemptedAt: expect.any(String),
    }));
  });

  it('guards the handler at 0 and 1; preserves progress on failure and retry; caps at 2', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    for (let count = 0; count < 2; count++) {
      expect(screen.queryByLabelText('Susunod na simbolo')).toBeNull();
      // Invoke the actual handler even though Next is not displayed yet.
      await act(async () => screen.UNSAFE_getByType(WritingNavigation).props.onNext());
      expect(screen.getByTestId('test-target').props.children).toBe('a');
      if (count) fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
      fireEvent.press(screen.getByLabelText('Draw a test stroke'));
      fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
      await waitFor(() => expect(screen.getByLabelText(masteryLabel(count + 1))).toBeTruthy());
      if (count === 0) {
        fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
        mockRecognizeWriting.mockResolvedValueOnce([{ label: 'ma', classIndex: 27, probability: 0.99 }]);
        fireEvent.press(screen.getByLabelText('Draw a test stroke'));
        fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
        await waitFor(() => expect(screen.getByText('Malapit na!')).toBeTruthy());
        expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
      }
    }
    expect(screen.getByLabelText('Susunod na simbolo').props.accessibilityState.disabled).toBe(false);
    await act(async () => screen.UNSAFE_getByType(WritingNavigation).props.onCheck());
    expect(mockRecognizeWriting).toHaveBeenCalledTimes(3);
    expect(screen.getByLabelText('Nakuha na ang dalawang bituin. Maaari nang magpatuloy.')).toBeTruthy();
    const next = screen.UNSAFE_getByType(WritingNavigation).props.onNext;
    await act(async () => { next(); next(); });
    expect(screen.getByTestId('test-target').props.children).toBe('e_i');
    expect(screen.getByLabelText('Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.')).toBeTruthy();
    expect(screen.queryByTestId('baya-predicted-class')).toBeNull();
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(0);
  });

  it('blocks replay of the same completed canvas, including a captured old handler', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    const check = screen.UNSAFE_getByType(WritingNavigation).props.onCheck;
    await act(async () => { check(); check(); });
    await waitFor(() => expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy());
    await act(async () => { check(); screen.UNSAFE_getByType(WritingNavigation).props.onCheck(); });
    expect(mockRecognizeWriting).toHaveBeenCalledTimes(1);
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
  });

  it.each([
    [[0.92, 0.85], [1, 2]],
    [[0.80, 0.80], [1, 2]],
    [[0.91, 0.76, -0.98, 0.84], [1, 1, 1, 2]],
  ])('enforces independent drawing progression %j', async (probabilities, counts) => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    for (let i = 0; i < probabilities.length; i++) {
      if (i) fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
      const probability = probabilities[i];
      const label = probability < 0 ? 'ka' : 'a';
      mockRecognizeWriting.mockResolvedValueOnce([{ label, classIndex: writingClassId(label), probability: Math.abs(probability) }]);
      fireEvent.press(screen.getByLabelText('Draw a test stroke'));
      fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
      await waitFor(() => expect(mockRecordAttempt).toHaveBeenCalledTimes(i + 1));
      await waitFor(() => expect(screen.getByLabelText(masteryLabel(counts[i]))).toBeTruthy());
      if (counts[i] < 2) expect(screen.queryByLabelText('Susunod na simbolo')).toBeNull();
      else expect(screen.getByLabelText('Susunod na simbolo').props.accessibilityState.disabled).toBe(false);
    }
  });

  it('counts a duplicated promise resolution once', async () => {
    let finish!: (value: typeof modelPredictions) => void;
    mockRecognizeWriting.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await act(async () => { finish(modelPredictions); finish(modelPredictions); });
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
  });

  it('ignores attempt A after new activity B has already succeeded', async () => {
    let finishA!: (value: typeof modelPredictions) => void;
    mockRecognizeWriting.mockImplementationOnce(() => new Promise(resolve => { finishA = resolve; }));
    const view = render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    view.rerender(<WritingPracticeScreen topicId="topic-3-2" />);
    mockRecognizeWriting.mockResolvedValueOnce([{ label: 'ba', classIndex: 2, probability: 0.90 }]);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy());
    await act(async () => finishA(modelPredictions));
    expect(screen.getByTestId('baya-predicted-class').props.children).toBe('BA');
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
  });

  it('preserves a success through runtime failure and canvas clearing', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
    mockRecognizeWriting.mockRejectedValueOnce(new Error('WASM execution failed'));
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByText('Hindi masuri ni BAYA ang sulat. Subukan muli.')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Clear test canvas'));
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(0);
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
  });

  it.each(['target', 'unmount'])('ignores inference invalidated by %s', async change => {
    let finish!: (value: typeof modelPredictions) => void;
    mockRecognizeWriting.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    expect(mockRecognizeWriting).toHaveBeenCalledTimes(1);
    if (change === 'target') view.rerender(<WritingPracticeScreen topicId="topic-3-2" />);
    if (change === 'unmount') view.unmount();
    await act(async () => finish(modelPredictions));
    expect(mockRecordAttempt).not.toHaveBeenCalled();
    if (change !== 'unmount') {
      expect(screen.getByLabelText('Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.')).toBeTruthy();
      expect(screen.queryByTestId('baya-predicted-class')).toBeNull();
    }
  });

  it('blocks drawing and clear events throughout saving without discarding the saved success', async () => {
    let finish!: () => void;
    mockRecordAttempt.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(mockRecordAttempt).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    expect(screen.getByText('Sinusuri ang sulat...')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Clear test canvas'));
    await act(async () => finish());
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    expect(screen.queryByTestId('baya-predicted-class')).toBeTruthy();
  });

  it('opening help preserves strokes, accepted progress, and pending saves', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    expect(within(screen.getByTestId('writing-instructions')).queryByTestId('writing-help-toggle')).toBeNull();
    expect(within(screen.getByTestId('writing-feedback-panel')).getByLabelText('Tulong sa pagsusuri')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Tulong sa pagsusuri'));
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(1);
    expect(mockRecognizeWriting).not.toHaveBeenCalled();
    expect(mockRecordAttempt).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Isara ang gabay'));
    let finish!: () => void;
    mockRecordAttempt.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(mockRecordAttempt).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByLabelText('Tulong sa pagsusuri'));
    expect(screen.getByLabelText('Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.')).toBeTruthy();
    await act(async () => finish());
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    expect(screen.getByText('Magaling! Isa pa para makapagpatuloy!')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Isara ang gabay'));
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(1);
    expect(mockRecognizeWriting).toHaveBeenCalledTimes(1);
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    expect(screen.getByTestId('baya-predicted-class').props.children).toBe('A');
  });

  it('blocks even captured clear, undo and retry handlers during inference', async () => {
    let finish!: (value: typeof modelPredictions) => void;
    mockRecognizeWriting.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    expect(screen.queryByLabelText('Ulitin ang pagsulat')).toBeNull();
    expect(screen.getByText(/Isulat ang simbolo at makakuha ng bituin!/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Tulong sa pagsusuri'));
    fireEvent.press(screen.getByTestId('writing-technical-toggle'));
    expect(screen.getByText(/hindi grado ng iyong sulat/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Isara ang gabay'));
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    const toolbar = screen.UNSAFE_getByType(WritingToolbar).props;
    const retry = screen.UNSAFE_getByType(WritingNavigation).props.onRetry;
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    expect(screen.UNSAFE_getByType(WritingToolbar).props.canEdit).toBe(false);
    act(() => { toolbar.onClear(); toolbar.onUndo(); retry(); });
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(1);
    await act(async () => finish(modelPredictions));
    expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
  });

  it('retains successful count and strokes through viewport changes, while reopening starts a fresh session', async () => {
    const view = render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy());
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      mockViewport = viewport;
      view.rerender(<WritingPracticeScreen topicId="topic-3-1" />);
      expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy();
      expect(screen.getByTestId('test-stroke-count').props.children).toBe(1);
    }
    view.unmount();
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    expect(screen.getByLabelText('Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.')).toBeTruthy();
    expect(mockRecordAttempt).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed inference without saving or credit', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockRecognizeWriting.mockResolvedValue([{ label: 'a', classIndex: 0, probability: NaN }]);
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByText('Hindi masuri ni BAYA ang sulat. Subukan muli.')).toBeTruthy());
    expect(mockRecordAttempt).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.')).toBeTruthy();
  });

  it('completes a topic once only after every character has two valid checks', async () => {
    const service = jest.requireMock('../../../../database/services/localLearnerService').localLearnerService;
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    for (const label of ['a', 'e_i', 'o_u']) {
      mockRecognizeWriting.mockResolvedValue([{ label, classIndex: writingClassId(label), probability: 0.8 }]);
      await masterCurrent();
      expect(service.completeTopic).not.toHaveBeenCalled();
      const next = screen.UNSAFE_getByType(WritingNavigation).props.onNext;
      await act(async () => { next(); next(); });
    }
    expect(service.completeTopic).toHaveBeenCalledTimes(1);
    expect(service.completeTopic).toHaveBeenCalledWith('topic-3-1');
    expect(mockRecordAttempt).toHaveBeenCalledTimes(6);
  });


  it.each([
    [], [[{ x: 0.5, y: 0.5, t: 10 }]],
    [[{ x: 0.5, y: 0.5, t: 10 }, { x: 0.501, y: 0.5, t: 11 }, { x: 0.502, y: 0.5, t: 12 }]],
  ].map(strokes => ({ strokes })))('does not infer or store an unusable drawing $strokes', async ({ strokes }) => {
    mockStrokeData = strokes;
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await act(async () => screen.UNSAFE_getByType(WritingNavigation).props.onCheck());
    expect(screen.getByText('Magsulat muna sa kahon bago suriin.')).toBeTruthy();
    expect(mockRecognizeWriting).not.toHaveBeenCalled();
    expect(mockRecordAttempt).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.')).toBeTruthy();
  });

  it('rejects a captured check handler after the canvas was cleared', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    const check = screen.UNSAFE_getByType(WritingNavigation).props.onCheck;
    await act(async () => check());
    await waitFor(() => expect(screen.getByLabelText('Isa sa dalawang bituin ang nakuha.')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Ulitin ang pagsulat'));
    await act(async () => check());
    expect(mockRecognizeWriting).toHaveBeenCalledTimes(1);
  });


  it('preserves the previous topic boundary selection but resets mastery', async () => {
    const view = render(<WritingPracticeScreen topicId="topic-3-2" />);
    await act(async () => screen.UNSAFE_getByType(ActivityHeader).props.onBack());
    view.rerender(<WritingPracticeScreen topicId="topic-3-1" />);
    expect(screen.getByTestId('test-target').props.children).toBe('o_u');
    expect(screen.getByLabelText('Wala pang bituin ang nakuha. Kailangan ng dalawang bituin.')).toBeTruthy();
  });

  it('uses the final lesson-completion path once after mastering the final topic', async () => {
    const service = jest.requireMock('../../../../database/services/localLearnerService').localLearnerService;
    let finishCompletion!: () => void;
    service.completeTopic.mockImplementationOnce(() => new Promise<void>(resolve => { finishCompletion = resolve; }));
    render(<WritingPracticeScreen topicId="topic-3-2" />);
    for (const exercise of writingTopics[1].exercises) {
      const label = exercise.characterId;
      mockRecognizeWriting.mockResolvedValue([{ label, classIndex: writingClassId(label), probability: 0.8 }]);
      await masterCurrent();
      const next = screen.UNSAFE_getByType(WritingNavigation).props.onNext;
      await act(async () => { next(); next(); });
    }
    expect(service.completeTopic).toHaveBeenCalledTimes(1);
    expect(service.completeTopic).toHaveBeenCalledWith('topic-3-2');
    fireEvent.press(screen.getByLabelText('Clear test canvas'));
    await act(async () => finishCompletion());
    expect(mockDismissTo).toHaveBeenCalledWith('/learner/lessons');
    await act(async () => screen.UNSAFE_getByType(WritingNavigation).props.onNext());
    expect(service.completeTopic).toHaveBeenCalledTimes(1);
  }, 15000);

  it('uses neutral confidence styling and the shared lesson speech bubble', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-confidence-percentage')).toBeTruthy());
    const percentage = screen.getByTestId('baya-confidence-percentage');
    expect(StyleSheet.flatten(percentage.props.style).color).toBe('#241F1B');
    expect(screen.queryByText('Mataas ang kumpiyansa ng BAYA!')).toBeNull();
    expect(screen.getByTestId('baya-result-bubble')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe(SpeechBubbleColors.border);
  });
});
