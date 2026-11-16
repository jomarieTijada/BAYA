import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { MascotOrigin } from '../MascotOrigin';
import { bayaniPhoto } from '../originStoryContent';
import { storybookPages } from '../storybookContent';
import { LocalizationProvider } from '../../../localization/LocalizationProvider';
import { LanguageSelector } from '../../../localization/LanguageSelector';
import { Image, Linking } from 'react-native';
import { StorybookVisual } from '../StorybookVisual';

jest.mock('../../../database/lifecycle', () => ({ getReadyDatabase: jest.fn() }));
let mockReduced = true;
afterEach(() => { mockReduced = true; });
jest.mock('../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => mockReduced }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../../branding/BayaMascot', () => {
  const { View } = jest.requireActual('react-native');
  return { BayaMascot: (props: object) => <View {...props} /> };
});

it('records supplied collage for local preview without claiming publication permission', () => {
  expect(bayaniPhoto.status).toBe('local-preview');
  expect(bayaniPhoto.publication).toBe('blocked-pending-permission');
  expect(bayaniPhoto.localAsset).toBeTruthy();
  expect(bayaniPhoto.license).toBeNull();
  expect(bayaniPhoto.sourceUrl).toContain('philippineeaglefoundation.org/post/princess-maasim');
});

it('reads five illustrated pages, reverses, finishes, and reopens at page one', () => {
  const view = render(<MascotOrigin />);
  fireEvent.press(view.getByTestId('mascot-origin-teaser'));
  expect(view.getByText('Meet BAYA!')).toBeTruthy();
  expect(view.getByLabelText('Previous')).toBeDisabled();
  fireEvent.press(view.getByLabelText('Next'));
  expect(view.getByText('The Story Behind Bayani')).toBeTruthy();
  expect(view.getByText(/real Philippine eagle named Bayani/)).toBeTruthy();
  fireEvent.press(view.getByLabelText('Previous'));
  expect(view.getByText('Meet BAYA!')).toBeTruthy();
  for (let i = 1; i < 5; i++) {
    fireEvent.press(view.getByLabelText('Next'));
    expect(view.getByText(storybookPages.en[i].title)).toBeTruthy();
    expect(view.getByTestId('origin-illustration')).toBeTruthy();
  }
  expect(view.getByText('Ma\'am Mini Gavino')).toBeTruthy();
  expect(view.getByText('Our Baybayin journey is just beginning!')).toBeTruthy();
  fireEvent.press(view.getByLabelText('Finish Reading'));
  expect(view.queryByTestId('origin-storybook')).toBeNull();
  fireEvent.press(view.getByTestId('mascot-origin-teaser'));
  expect(view.getByText('Meet BAYA!')).toBeTruthy();
  fireEvent.press(view.getByLabelText('Close the story'));
  expect(view.queryByTestId('origin-storybook')).toBeNull();
});

it('keeps the saved language and changes language without resetting the page', async () => {
  const storage = { load: jest.fn(async () => 'en' as const), save: jest.fn(async () => {}) };
  const view = render(<LocalizationProvider storage={storage}><LanguageSelector /><MascotOrigin /></LocalizationProvider>);
  fireEvent.press(await view.findByTestId('mascot-origin-teaser'));
  fireEvent.press(view.getByLabelText('Next'));
  fireEvent.press(view.getByLabelText('Tagalog'));
  expect(view.getByText('Ang Kuwento ni Bayani')).toBeTruthy();
  await waitFor(() => expect(storage.save).toHaveBeenCalledWith('tl'));
  fireEvent.press(view.getByLabelText('Bumalik'));
  expect(view.getByText('Kilalanin ang BAYA!')).toBeTruthy();
});

it.each(['en', 'tl'] as const)('has five complete, ordered local pages in %s', language => {
  expect(storybookPages[language].map(page => page.id)).toEqual(['meet', 'inspiration', 'baya', 'baybayin', 'thanks']);
  for (const page of storybookPages[language]) {
    expect(page.paragraphs.length).toBe(3);
    if (page.visual === 'learning' || page.visual === 'characters') expect(page.caption).toBe('');
    else expect(page.caption).toBeTruthy();
  }
});

it('uses the latest language when a turn finishes without resetting the destination', async () => {
  mockReduced = false;
  const storage = { load: jest.fn(async () => 'en' as const), save: jest.fn(async () => {}) };
  const view = render(<LocalizationProvider storage={storage}><LanguageSelector /><MascotOrigin /></LocalizationProvider>);
  fireEvent.press(await view.findByTestId('mascot-origin-teaser'));
  fireEvent.press(view.getByLabelText('Next'));
  fireEvent.press(view.getByLabelText('Tagalog'));
  await waitFor(() => expect(view.getByText('Ang Kuwento ni Bayani')).toBeTruthy());
  await waitFor(() => expect(view.getByLabelText('Susunod')).not.toBeDisabled());
  expect(view.getByTestId('origin-progress').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 40, text: 'Pahina 2 ng 5' });
  expect(view.queryByText('Pahina 2 ng 5')).toBeNull();
});

it('renders the supplied collage with its historical source and handles native link failure', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('offline'));
  const view = render(<StorybookVisual page={storybookPages.en[1]} language="en" mascotSize={200} />);
  expect(view.queryByLabelText(/woven hat/)).toBeNull();
  expect(view.UNSAFE_queryAllByType(Image)).toHaveLength(1);
  fireEvent.press(view.getByLabelText('Read Bayani’s Story'));
  expect(open).toHaveBeenCalledWith(bayaniPhoto.sourceUrl);
  expect(await view.findByText('The website could not open. Please try again when online.')).toBeTruthy();
  open.mockRestore();
});

it('shows all three kudlit examples and provides readable image-error feedback', () => {
  const view = render(<StorybookVisual page={storybookPages.en[3]} language="en" mascotSize={200} />);
  for (const label of ['Ba: No kudlit', 'Be / Bi: Kudlit above', 'Bo / Bu: Kudlit below']) {
    expect(view.getByLabelText(label)).toBeTruthy();
  }
  fireEvent(view.getByLabelText('Be / Bi: Kudlit above'), 'error');
  expect(view.getByText('The illustration could not load. Be / Bi: Kudlit above')).toBeTruthy();
  expect(view.getByLabelText('Bo / Bu: Kudlit below')).toBeTruthy();
});

 it('renders both supplied acknowledgement artworks without logo claims', () => {
  const view = render(<StorybookVisual page={storybookPages.en[4]} language="en" mascotSize={200} />);
  expect(view.UNSAFE_queryAllByType(Image)).toHaveLength(3);
  expect(view.getByLabelText(/Eagle close-up with stylized/)).toBeTruthy();
  expect(view.getByLabelText(/Colorful circular artwork/)).toBeTruthy();
 });
