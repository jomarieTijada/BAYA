import React from 'react';
import { fireEvent, render, screen, act } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { BayaNotifications, useBayaToast } from '../BayaNotifications';
jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})}));
jest.mock('../../../hooks/useReducedMotionPreference',()=>({useReducedMotionPreference:()=>true}));
jest.mock('../AppIcon',()=>({AppIcon:()=>null}));
function Trigger() { const toast=useBayaToast(); return <Pressable accessibilityLabel="Request completed" onPress={()=>toast('Verification code requested. Check your email.')}><Text>Notify</Text></Pressable>; }
it('coalesces duplicate messages, permits dismissal, and expires notifications', () => {
  jest.useFakeTimers();
  render(<BayaNotifications><Trigger /></BayaNotifications>);
  fireEvent.press(screen.getByLabelText('Request completed'));
  fireEvent.press(screen.getByLabelText('Request completed'));
  expect(screen.getAllByText('Verification code requested. Check your email.')).toHaveLength(1);
  fireEvent.press(screen.getByLabelText('Dismiss notification'));
  expect(screen.queryByText('Verification code requested. Check your email.')).toBeNull();
  act(()=>jest.advanceTimersByTime(2000));
  fireEvent.press(screen.getByLabelText('Request completed'));
  act(()=>jest.advanceTimersByTime(6000));
  expect(screen.queryByText('Verification code requested. Check your email.')).toBeNull();
  jest.useRealTimers();
});
