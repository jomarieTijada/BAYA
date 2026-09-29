import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Platform, StyleSheet } from 'react-native';
import { BayaWritingGuide } from '../BayaWritingGuide';
import { WritingPracticeScreen } from '../WritingPracticeScreen';

const mockRecognizeWriting = jest.fn();
const mockAssess = jest.fn();
const mockRecordAttempt = jest.fn();
let mockViewport = { width: 1440, height: 900 };

jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: jest.fn(), push: jest.fn(), setParams: jest.fn() }),
}));
jest.mock('../../../../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => mockViewport,
}));
jest.mock('../../../../ml/writingRecognition', () => ({
  recognizeWriting: (...args: unknown[]) => mockRecognizeWriting(...args),
}));
jest.mock('../../../../content/writingRecognitionService', () => ({
  localWritingRecognitionService: { assess: (...args: unknown[]) => mockAssess(...args) },
}));
jest.mock('../../../../database/services/localLearnerService', () => ({
  localLearnerService: {
    recordWritingAttempt: (...args: unknown[]) => mockRecordAttempt(...args),
    completeTopic: jest.fn(async () => undefined),
  },
}));
jest.mock('../../LearnerAppShell', () => ({
  LearnerAppShell: ({ children }: { children: React.ReactNode }) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('../../activity/ActivityHeader', () => ({ ActivityHeader: () => null }));
jest.mock('../CharacterReferenceCard', () => ({ CharacterReferenceCard: ({ exercise }: { exercise: { characterId: string } }) => {
  const { Text } = jest.requireActual('react-native');
  return <Text testID="test-target">{exercise.characterId}</Text>;
} }));
jest.mock('../WritingToolbar', () => ({ WritingToolbar: () => null }));
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
      onChange([[{ x: 0.1, y: 0.1, t: 1000 }, { x: 0.4, y: 0.5, t: 1020 }, { x: 0.8, y: 0.7, t: 1050 }]]);
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
    mockViewport = { width: 1440, height: 900 };
    mockAssess.mockImplementation(async (characterId: string, strokes: unknown[]) => strokes.length ? {
      characterId, strokeData: strokes, imageData: null, confidence: 0.7, result: 'similar',
    } : null);
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
    expect(screen.getByLabelText('Bumalik sa naunang simbolo')).toBeTruthy();
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
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByText('Magsulat muna sa kahon bago suriin.')).toBeTruthy());
    expect(mockRecognizeWriting).not.toHaveBeenCalled();
    expect(screen.queryByText(/0%|NaN|Unknown/)).toBeNull();
  });

  it('shows a friendly bubble on inference failure and logs technical detail only in development', async () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    mockRecognizeWriting.mockRejectedValue(new Error('private ONNX detail'));
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByText('Hindi masuri ni BAYA ang sulat. Subukan muli.')).toBeTruthy());
    expect(screen.queryByText('private ONNX detail')).toBeNull();
    expect(screen.getByLabelText('Suriin ang isinulat')).toBeTruthy();
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
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe('#EBC48B');
    expect(screen.getByTestId('test-baya-mascot').props.children).toBe('ambient');
  });

  it('shows a compact amber retry result for wrong DA/RA at 99.3% confidence', () => {
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
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe('#EBC48B');
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

  it('renders correct BA ahead of PA and MA with green success styling', async () => {
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
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe('#91CCA0');
  });

  it('Balik returns to the previous symbol and clears the current attempt', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Susunod na simbolo'));
    expect(screen.getByTestId('test-target').props.children).toBe('e_i');
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class')).toBeTruthy());
    expect(screen.getByText('Back')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Bumalik sa naunang simbolo'));
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

  it('keeps the existing Susunod progression after a saved result', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByLabelText('Susunod na simbolo')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Susunod na simbolo'));
    expect(screen.getByTestId('test-target').props.children).toBe('e_i');
    expect(screen.getByTestId('test-stroke-count').props.children).toBe(0);
    expect(screen.getByLabelText('Suriin ang isinulat')).toBeTruthy();
  });

  it.each([[360, 780], [390, 844], [430, 932], [768, 1024], [900, 800], [1440, 900]])(
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
      expect(screen.getByLabelText('Susunod na simbolo')).toBeTruthy();
    },
  );

  it('clears the old result when the drawing changes and allows a new check', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-predicted-class')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    expect(screen.queryByTestId('baya-predicted-class')).toBeNull();
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(mockRecognizeWriting).toHaveBeenCalledTimes(2));
  });

  it('uses neutral confidence styling and a correctness-colored speech bubble', async () => {
    render(<WritingPracticeScreen topicId="topic-3-1" />);
    fireEvent.press(screen.getByLabelText('Draw a test stroke'));
    fireEvent.press(screen.getByLabelText('Suriin ang isinulat'));
    await waitFor(() => expect(screen.getByTestId('baya-confidence-percentage')).toBeTruthy());
    const percentage = screen.getByTestId('baya-confidence-percentage');
    expect(StyleSheet.flatten(percentage.props.style).color).toBe('#241F1B');
    expect(screen.queryByText('Mataas ang kumpiyansa ng BAYA!')).toBeNull();
    expect(screen.getByTestId('baya-result-bubble')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('baya-result-bubble').props.style).borderColor).toBe('#91CCA0');
  });
});
