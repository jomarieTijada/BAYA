import { renderHook } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { useLocalizedAlert } from '../useLocalizedAlert';

jest.mock('../LocalizationProvider', () => ({
  useLocalization: () => ({ text: (value: string) => `translated: ${value}` }),
}));

describe('localized error dialogs', () => {
  const originalPlatform = Platform.OS;
  const originalAlert = window.alert;
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    window.alert = originalAlert;
    jest.restoreAllMocks();
  });

  it('shows browser feedback instead of calling the no-op web Alert', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    window.alert = jest.fn();
    const native = jest.spyOn(Alert, 'alert');
    const { result } = renderHook(useLocalizedAlert);
    result.current('Could not save progress', 'Please try again.');
    expect(window.alert).toHaveBeenCalledWith('translated: Could not save progress\n\ntranslated: Please try again.');
    expect(native).not.toHaveBeenCalled();
  });

  it('preserves the native translated dialog', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    const native = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { result } = renderHook(useLocalizedAlert);
    result.current('Could not save progress', 'Please try again.');
    expect(native).toHaveBeenCalledWith('translated: Could not save progress', 'translated: Please try again.');
  });
});
