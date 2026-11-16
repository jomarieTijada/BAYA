import React, { useState } from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { LocalizationProvider, useLocalization } from '../LocalizationProvider';
import { LanguageSelector } from '../LanguageSelector';
import { Text, TextInput } from '../components';
import { createLanguageStorage } from '../storage';
import type { Language } from '../core';
import type { DatabaseConnection } from '../../database/types';
jest.mock('../../database/lifecycle', () => ({ getReadyDatabase: jest.fn() }));

function Activity() {
  const [answer, setAnswer] = useState('');
  return <><LanguageSelector /><Text>Settings</Text><Text verbatim>Settings</Text><TextInput testID="answer" value={answer} onChangeText={setAnswer} placeholder="Enter your name" /></>;
}
function Choose() {
  const { setLanguage } = useLocalization();
  return <NativeTextInput testID="choose" onChangeText={value => setLanguage(value as Language)} />;
}
const storageFor = (initial: Language = 'en') => {
  let saved = initial;
  return { load: jest.fn(async () => saved), save: jest.fn(async (value: Language) => { saved = value; }) };
};
describe('language preference and presentation', () => {
  it('switches immediately, preserves mounted input and user text, survives remount', async () => {
    const storage = storageFor();
    const view = render(<LocalizationProvider storage={storage}><Activity /></LocalizationProvider>);
    await view.findByLabelText('Tagalog');
    fireEvent.changeText(view.getByTestId('answer'), 'Selected answer and strokes remain');
    fireEvent.press(view.getByLabelText('Tagalog'));
    expect(view.getByText('Mga Setting')).toBeTruthy();
    expect(view.getByText('Settings')).toBeTruthy(); // user content remains verbatim
    expect(view.getByTestId('answer').props.value).toBe('Selected answer and strokes remain');
    expect(view.getByPlaceholderText('Ilagay ang iyong pangalan')).toBeTruthy();
    await waitFor(() => expect(storage.save).toHaveBeenCalledWith('tl'));
    view.unmount();
    const reopened = render(<LocalizationProvider storage={storage}><Activity /></LocalizationProvider>);
    await reopened.findByText('Mga Setting');
    fireEvent.press(reopened.getByLabelText('English'));
    expect(reopened.getByText('Language')).toBeTruthy();
    expect(storage.load).toHaveBeenCalledTimes(2);
  });
  it('serializes rapid changes and reports failed persistence without undoing the UI', async () => {
    let complete!: () => void;
    const storage = { load: async () => 'en' as const, save: jest.fn().mockImplementationOnce(() => new Promise<void>(resolve => { complete = resolve; })).mockRejectedValueOnce(new Error('busy')) };
    const view = render(<LocalizationProvider storage={storage}><Activity /><Choose /></LocalizationProvider>);
    await view.findByLabelText('Tagalog');
    fireEvent.changeText(view.getByTestId('choose'), 'tl');
    await waitFor(() => expect(storage.save).toHaveBeenCalledTimes(1));
    fireEvent.changeText(view.getByTestId('choose'), 'en');
    expect(storage.save).toHaveBeenCalledTimes(1);
    await act(async () => complete());
    await view.findByText('Language changed for this session. Could not save it. Select the language to retry.');
    expect(storage.save.mock.calls.map(([value]) => value)).toEqual(['tl', 'en']);
  });
  it('uses the existing device table and never overwrites a preference during load', async () => {
    const db = { getFirstAsync: jest.fn().mockResolvedValue({ state_value: 'tl' }), runAsync: jest.fn() } as unknown as DatabaseConnection;
    const storage = createLanguageStorage(async () => db);
    expect(await storage.load()).toBe('tl');
    expect(db.runAsync).not.toHaveBeenCalled();
    await storage.save('en');
    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(state_key)'), ['interface_language', 'en']);
    (db.getFirstAsync as jest.Mock).mockResolvedValue({ state_value: 'unknown' });
    expect(await storage.load()).toBe('en');
  });
  it('remains usable when preference loading fails', async () => {
    const view = render(<LocalizationProvider storage={{ load: async () => { throw Error('unavailable'); }, save: async () => {} }}><Activity /></LocalizationProvider>);
    await view.findByLabelText('Tagalog');
    fireEvent.press(view.getByLabelText('Tagalog'));
    expect(view.getByText('Mga Setting')).toBeTruthy();
  });
});
