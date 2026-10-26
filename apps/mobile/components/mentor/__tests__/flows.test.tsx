/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories must resolve modules inside the factory. */
import React from 'react';
import { Modal } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor, within,
} from '@testing-library/react-native';
import { AuthScreen, OtpScreen } from '../AuthScreen';
import { WorkspaceManageScreen } from '../WorkspaceManageScreen';
import { LearnerCloudAccount } from '../../learner/LearnerCloudAccount';
import {
  WorkspaceSelectionScreen,
  CreateWorkspaceScreen,
  MentorBoundary,
} from '../WorkspaceScreens';
import {
  LearnerMembershipScreen,
} from '../../learner/LearnerWorkspaceScreens';
import {
  CloudServicesContext,
  pendingCloudServices,
  type CloudServices,
} from '../../../modules/cloud/services';
import {
  fixtureServices,
  joinedFixture,
  workspaceFixture,
} from '../../debug/workspaces/fixtures';
import {
  authErrors,
  codeError,
  normalizeCode,
  nameError,
} from '../../../modules/cloud/validation';
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => true }));
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void) => {
    require('react').useEffect(callback, [callback]);
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
  useSafeAreaInsets: () => ({top:0,bottom:0,left:0,right:0}),
}));
jest.mock('../../ui/AppIcon', () => ({ AppIcon: () => null }));
function mount(
  node: React.ReactNode,
  services: CloudServices = fixtureServices,
) {
  return render(
    <CloudServicesContext.Provider value={services}>
      {node}
    </CloudServicesContext.Provider>,
  );
}
function credentials() {
  fireEvent.changeText(
    screen.getByLabelText('EMAIL ADDRESS, required'),
    ' Mentor@Example.Test ',
  );
  fireEvent.changeText(
    screen.getByLabelText('PASSWORD, required'),
    'test-password',
  );
}
beforeEach(() => jest.clearAllMocks());
it('completes password recovery only after validating and submitting the email code', async () => {
  const completePasswordReset = jest.fn(async () => ({ ok: true as const, data: undefined }));
  mount(<AuthScreen mode="reset" />, { ...fixtureServices, auth: { ...fixtureServices.auth,
    resetPassword: async () => ({ ok: true, data: undefined }), completePasswordReset } });
  fireEvent.changeText(screen.getByLabelText('EMAIL ADDRESS, required'), 'mentor@example.test');
  fireEvent.press(screen.getByLabelText('Request reset'));
  await screen.findByLabelText('RESET CODE, required');
  fireEvent.press(screen.getByLabelText('Update password'));
  expect(completePasswordReset).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('RESET CODE, required'), '123456');
  fireEvent.changeText(screen.getByLabelText('NEW PASSWORD, required'), 'new-password');
  fireEvent.changeText(screen.getByLabelText('CONFIRM PASSWORD, required'), 'new-password');
  fireEvent.press(screen.getByLabelText('Update password'));
  await screen.findByLabelText('Go to login');
  expect(completePasswordReset).toHaveBeenCalledWith('mentor@example.test', '123456', 'new-password');
});
it('validates login and toggles secure entry without submitting invalid fields', () => {
  const login = jest.fn();
  mount(<AuthScreen />, {
    ...fixtureServices,
    auth: { ...fixtureServices.auth, login },
  });
  fireEvent.press(screen.getByLabelText('Log In'));
  expect(screen.getByText('Enter your email address.')).toBeTruthy();
  expect(login).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Show password'));
  expect(
    screen.getByLabelText('PASSWORD, required').props.secureTextEntry,
  ).toBe(false);
});
it('transitions from credentials to real service challenge and verified navigation', async () => {
  mount(<AuthScreen />);
  credentials();
  fireEvent.press(screen.getByLabelText('Log In'));
  await screen.findByText('VERIFY YOUR EMAIL');
  fireEvent.changeText(
    screen.getByLabelText('VERIFICATION CODE, required'),
    'test-code',
  );
  fireEvent.press(screen.getByLabelText('Verify code'));
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith('/mentor/workspaces'),
  );
});
it('does not fabricate success with the production adapter', async () => {
  mount(<AuthScreen />, pendingCloudServices);
  credentials();
  fireEvent.press(screen.getByLabelText('Log In'));
  await screen.findByText(/not available yet/);
  expect(mockReplace).not.toHaveBeenCalled();
});
it('prevents duplicate requests and shows loading', async () => {
  let resolve!: (value: { ok: false; code: 'credentials' }) => void;
  const login = jest.fn(
    () =>
      new Promise<{ ok: false; code: 'credentials' }>((r) => {
        resolve = r;
      }),
  );
  mount(<AuthScreen />, {
    ...fixtureServices,
    auth: { ...fixtureServices.auth, login },
  });
  credentials();
  fireEvent.press(screen.getByLabelText('Log In'));
  fireEvent.press(screen.getByLabelText('Log In'));
  expect(login).toHaveBeenCalledTimes(1);
  expect(screen.getByText('PLEASE WAIT…')).toBeTruthy();
  await act(async () => resolve({ ok: false, code: 'credentials' }));
  expect(screen.getByText(/email or password is incorrect/)).toBeTruthy();
});
it('registers only matching passwords and follows verification response', async () => {
  const register = jest.fn(async () => ({
    ok: true as const,
    data: { kind: 'check_email' as const },
  }));
  mount(<AuthScreen mode="register" />, {
    ...fixtureServices,
    auth: { ...fixtureServices.auth, register },
  });
  credentials();
  fireEvent.changeText(screen.getByLabelText('FULL NAME, required'), ' Maria ');
  fireEvent.press(screen.getByLabelText('Create Account'));
  expect(screen.getByText('Passwords must match.')).toBeTruthy();
  fireEvent.changeText(
    screen.getByLabelText('CONFIRM PASSWORD, required'),
    'test-password',
  );
  fireEvent.press(screen.getByLabelText('Create Account'));
  await screen.findByText(/If confirmation is needed/);
  expect(register).toHaveBeenCalledWith(
    'Maria',
    'mentor@example.test',
    'test-password',
  );
  expect(mockReplace).not.toHaveBeenCalled();
});
it('represents expired OTP and does not enter a workspace', async () => {
  mount(
    <OtpScreen
      challenge={{ id: 'challenge', email: 'a@b.test' }}
      onBack={jest.fn()}
      onOutcome={mockReplace}
    />,
    {
      ...fixtureServices,
      auth: {
        ...fixtureServices.auth,
        verify: async () => ({ ok: false, code: 'expired_code' }),
      },
    },
  );
  fireEvent.changeText(
    screen.getByLabelText('VERIFICATION CODE, required'),
    'bad',
  );
  fireEvent.press(screen.getByLabelText('Verify code'));
  await screen.findByText(/code has expired/);
  expect(mockReplace).not.toHaveBeenCalled();
});
it('guards mentor routes while session is unavailable', async () => {
  mount(
    <MentorBoundary>
      <WorkspaceSelectionScreen />
    </MentorBoundary>,
    pendingCloudServices,
  );
  await screen.findByText(/not available yet/);
  expect(screen.queryByText('No Workspace Created Yet')).toBeNull();
});
it('distinguishes loading from an authoritative empty list and wires creation', async () => {
  let resolve!: (value: { ok: true; data: [] }) => void;
  mount(<WorkspaceSelectionScreen />, {
    ...fixtureServices,
    workspaces: {
      ...fixtureServices.workspaces,
      listOwned: () =>
        new Promise((r) => {
          resolve = r;
        }),
    },
  });
  expect(screen.queryByText('No Workspace Created Yet')).toBeNull();
  await waitFor(() => expect(resolve).toEqual(expect.any(Function)));
  await act(async () => resolve({ ok: true, data: [] }));
  fireEvent.press(screen.getByLabelText('Create workspace'));
  expect(mockPush).toHaveBeenCalledWith('/mentor/workspaces/create');
});
it('navigates using UUID rather than code and renders service counts', async () => {
  mount(<WorkspaceSelectionScreen />);
  await screen.findByText('Baybayin Workshop A');
  expect(screen.getByText('3 Learners')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Enter Baybayin Workshop A'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/mentor/workspaces/[id]',
    params: { id: workspaceFixture.workspace_id },
  });
});
it('creates only after confirmation and passes the trimmed name', async () => {
  const create = jest.fn(fixtureServices.workspaces.create);
  mount(<CreateWorkspaceScreen />, {
    ...fixtureServices,
    workspaces: { ...fixtureServices.workspaces, create },
  });
  fireEvent.press(screen.getByLabelText('Create workspace'));
  expect(screen.getByText('Enter a workspace name.')).toBeTruthy();
  fireEvent.changeText(
    screen.getByLabelText('WORKSPACE NAME, required'),
    ' My workspace ',
  );
  fireEvent.press(screen.getByLabelText('Create workspace'));
  await waitFor(() => expect(create).toHaveBeenCalledWith('My workspace'));
  expect(mockReplace).toHaveBeenCalledWith({
    pathname: '/mentor/workspaces/[id]',
    params: { id: workspaceFixture.workspace_id },
  });
});
it('handles existing memberships through the authorized service', async () => {
  const requestJoin = jest.fn(async () => ({
    ok: true as const,
    data: { kind: 'already_member' as const, joined: { ...joinedFixture, alreadyJoined: true } },
  }));
  mount(<LearnerMembershipScreen />, {
    ...fixtureServices,
    workspaces: { ...fixtureServices.workspaces, requestJoin },
  });
  fireEvent.press(screen.getByLabelText('Join workspace'));
  fireEvent.changeText(
    await screen.findByLabelText('WORKSPACE CODE, required'),
    ' baya-7k2p ',
  );
  fireEvent.press(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name: 'JOIN WORKSPACE' }));
  await screen.findByText('You are now connected to your mentor’s workspace.');
  expect(requestJoin).toHaveBeenCalledWith('BAYA-7K2P');
  fireEvent.press(screen.getByLabelText('MY WORKSPACES'));
  expect(screen.getByText('MY WORKSPACES')).toBeTruthy();
});
it('shows verified learner memberships', async () => {
  mount(<LearnerMembershipScreen />);
  await screen.findByText('Baybayin Workshop A');
  expect(screen.getByText('Joined')).toBeTruthy();
});
it.each(['not_found', 'inactive', 'unauthorized', 'offline'] as const)(
  'does not confirm a %s join',
  async (code) => {
    mount(<LearnerMembershipScreen />, {
      ...fixtureServices,
      workspaces: {
        ...fixtureServices.workspaces,
        requestJoin: async () => ({ ok: false, code }),
      },
    });
    fireEvent.press(screen.getByLabelText('Join workspace'));
    fireEvent.changeText(
      await screen.findByLabelText('WORKSPACE CODE, required'),
      'BAYA-TEST',
    );
    fireEvent.press(within(screen.UNSAFE_getByType(Modal)).getByRole('button', { name: 'JOIN WORKSPACE' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.queryByText('YOU’RE CONNECTED!')).toBeNull();
  },
);
it('defers provider-specific rules and never treats a public code as a UUID', () => {
  expect(normalizeCode(' baya-abc ')).toBe('BAYA-ABC');
  expect(codeError(' code with spaces ', {})).toBeTruthy();
  expect(codeError('DIFFERENT-FORMAT', {})).toBeUndefined();
  expect(nameError(' ', {})).toBeTruthy();
  expect(
    authErrors(
      { name: 'A', email: 'a@b.test', password: 'x', confirm: 'x' },
      true,
      {},
    ).password,
  ).toBeUndefined();
});

it('wires registration and password reset links', () => {
  mount(<AuthScreen />);
  fireEvent.press(screen.getByLabelText('Forgot Password?'));
  expect(mockPush).toHaveBeenCalledWith('/mentor/reset-password');
  fireEvent.press(
    screen.getByLabelText('Don’t have a mentor account? Create Account'),
  );
  expect(mockReplace).toHaveBeenCalledWith('/mentor/register');
});
it('only reports reset delivery after the provider confirms the request', async () => {
  mount(<AuthScreen mode="reset" />, pendingCloudServices);
  fireEvent.changeText(
    screen.getByLabelText('EMAIL ADDRESS, required'),
    'mentor@example.test',
  );
  fireEvent.press(screen.getByLabelText('Request reset'));
  await screen.findByText(/not available yet/);
  expect(screen.queryByText(/eligible account exists/)).toBeNull();
});
it('does not show an empty workspace state for a failed fetch', async () => {
  mount(<WorkspaceSelectionScreen />, {
    ...fixtureServices,
    workspaces: {
      ...fixtureServices.workspaces,
      listOwned: async () => ({ ok: false, code: 'unauthorized' }),
    },
  });
  await screen.findByText(/session may have expired/);
  expect(screen.queryByText('No Workspace Created Yet')).toBeNull();
});
it('allows a provider-backed OTP resend and replaces the challenge', async () => {
  const verify = jest.fn(async () => ({
    ok: false as const,
    code: 'invalid_code' as const,
  }));
  const resend = jest.fn(async () => ({
    ok: true as const,
    data: { id: 'replacement-challenge', email: 'mentor@example.test' },
  }));
  mount(
    <OtpScreen
      challenge={{ id: 'original-challenge', email: 'mentor@example.test' }}
      onBack={jest.fn()}
      onOutcome={mockReplace}
    />,
    { ...fixtureServices, auth: { ...fixtureServices.auth, resend, verify } },
  );
  fireEvent.press(screen.getByLabelText('Resend code'));
  expect(resend).not.toHaveBeenCalled();
  expect(screen.getByText('You can request another code in 1:00.')).toBeTruthy();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61000);
  await waitFor(() => expect(screen.getByText('You can now request another code.')).toBeTruthy(), { timeout: 2500 });
  fireEvent.press(screen.getByLabelText('Resend code'));
  await waitFor(() => expect(resend).toHaveBeenCalledTimes(1));
  expect(screen.getByText('You can request another code in 1:00.')).toBeTruthy();
  clock.mockRestore();
  fireEvent.changeText(
    screen.getByLabelText('VERIFICATION CODE, required'),
    'invalid-test-code',
  );
  fireEvent.press(screen.getByLabelText('Verify code'));
  await waitFor(() =>
    expect(verify).toHaveBeenCalledWith(
      'replacement-challenge',
      'invalid-test-code',
    ),
  );
  expect(mockReplace).not.toHaveBeenCalled();
});

it('archives only after confirmation and preserves the workspace identity', async()=>{
 const update=jest.fn().mockResolvedValue({ok:true,data:{...workspaceFixture,status:'archived'}});
 mount(<WorkspaceManageScreen id={workspaceFixture.workspace_id}/>,{...fixtureServices,workspaces:{...fixtureServices.workspaces,update,members:async()=>({ok:true,data:[]})}});
 fireEvent.press(await screen.findByText('Archive workspace'));expect(update).not.toHaveBeenCalled();
 fireEvent.press(screen.getByLabelText('CONFIRM ARCHIVE', { includeHiddenElements: true }));
 await waitFor(()=>expect(update).toHaveBeenCalledWith(workspaceFixture.workspace_id,workspaceFixture.workspace_name,'archived'));
});
it('exposes code-only joining without requiring learner email', async () => {
 const session=jest.fn(); const request=jest.fn(); const verify=jest.fn();
 mount(<LearnerMembershipScreen/>,{...fixtureServices,learnerAuth:{session,request,verify,signOut:async()=>({ok:true,data:undefined})}});
 fireEvent.press(screen.getByLabelText('Join workspace'));
 expect(screen.getByLabelText('WORKSPACE CODE, required')).toBeTruthy();
 expect(screen.queryByLabelText('LEARNER EMAIL')).toBeNull();
 expect(session).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
});
it('routes learner account actions to Settings',async()=>{
 const signOut=jest.fn().mockResolvedValue({ok:true,data:undefined});
 mount(<LearnerCloudAccount/>,{...fixtureServices,learnerAuth:{...fixtureServices.learnerAuth!,signOut}});
 fireEvent.press(await screen.findByText('Account settings'));expect(mockPush).toHaveBeenCalledWith('/learner/settings');expect(signOut).not.toHaveBeenCalled();
});
