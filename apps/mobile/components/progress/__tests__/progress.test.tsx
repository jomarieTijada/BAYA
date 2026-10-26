/* eslint-disable @typescript-eslint/no-require-imports -- Jest factories resolve React inside the factory. */
import React from 'react';
import { Modal } from 'react-native';
import { act, render,screen,fireEvent,waitFor } from '@testing-library/react-native';
import { MentorDashboard } from '../MentorDashboard';
import { WorkspaceSelectionScreen } from '../../mentor/WorkspaceScreens';
import { LearnerActionMenu } from '../../learner/LearnerActionMenu';
import { LearnerProgressDetail } from '../LearnerProgressDetail';
import { CloudServicesContext,type CloudServices,pendingCloudServices } from '../../../modules/cloud/services';
import { progressPreviewServices } from '../../debug/workspaces/progressFixtures';
const mockPush=jest.fn();
const mockReplace=jest.fn();
const mockToast=jest.fn();
jest.mock('../../ui/BayaNotifications',()=>({useBayaToast:()=>mockToast}));
jest.mock('../../../hooks/useReducedMotionPreference',()=>({useReducedMotionPreference:()=>true}));
jest.mock('expo-router',()=>({router:{push:(...args:unknown[])=>mockPush(...args),replace:(...args:unknown[])=>mockReplace(...args)},useFocusEffect:(cb:()=>void)=>require('react').useEffect(cb,[cb])}));
jest.mock('react-native-safe-area-context',()=>({SafeAreaView:require('react-native').View,useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})}));
jest.mock('../../ui/AppIcon',()=>({AppIcon:()=>null}));
const mount=(node:React.ReactNode,services:CloudServices=progressPreviewServices)=>render(<CloudServicesContext.Provider value={services}>{node}</CloudServicesContext.Provider>,{createNodeMock:()=>({measureInWindow:(cb:(x:number,y:number,w:number,h:number)=>void)=>cb(600,32,48,48),focus:jest.fn()})});
beforeEach(()=>jest.clearAllMocks());
function toggleMenu(label = 'Workspace options') {
 screen.UNSAFE_root.findAll(node=>!!node.instance?.measureInWindow).forEach(node=>{
  jest.spyOn(node.instance,'measureInWindow').mockImplementation((...args: unknown[]) => (args[0] as (x:number,y:number,w:number,h:number)=>void)(600,32,48,48));
 });
 fireEvent.press(screen.getByLabelText(label));
}
it.each(['email', 'anonymous', 'local'] as const)('confirms learner logout and preserves access for %s learners', async kind => {
 const signOut = jest.fn(async () => ({ ok: true as const, data: undefined }));
 const session = jest.fn(async () => ({ ok: true as const, data: kind === 'local' ? null : { email: kind === 'email' ? 'learner@example.test' : '', profileId: 'learner-one' } }));
 const learnerAuth = { session, signOut, request: jest.fn(), verify: jest.fn() };
 mount(<LearnerActionMenu groups={[]} />, { ...progressPreviewServices, learnerAuth });
 toggleMenu('Settings');
 fireEvent.press(await screen.findByLabelText('Log Out'));
 expect(session).not.toHaveBeenCalled();
 fireEvent.press(screen.getByLabelText('CANCEL', { includeHiddenElements: true }));
 expect(mockReplace).not.toHaveBeenCalled();
 toggleMenu('Settings');
 fireEvent.press(await screen.findByLabelText('Log Out'));
 fireEvent.press(screen.getByLabelText('YES, LOG OUT', { includeHiddenElements: true }));
 await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
 expect(signOut).toHaveBeenCalledTimes(kind === 'email' ? 1 : 0);
});
it('keeps learner logout open when account sign-out fails', async () => {
 const signOut = jest.fn(async () => ({ ok: false as const, code: 'network' as const }));
 mount(<LearnerActionMenu groups={[]} />, { ...progressPreviewServices, learnerAuth: {
   session: async () => ({ ok: true, data: { email: 'learner@example.test', profileId: 'learner-one' } }),
   signOut, request: jest.fn(), verify: jest.fn(),
 } });
 toggleMenu('Settings');
 fireEvent.press(await screen.findByLabelText('Log Out'));
 fireEvent.press(screen.getByLabelText('YES, LOG OUT', { includeHiddenElements: true }));
 await screen.findByText('We couldn’t connect. Please try again.', { includeHiddenElements: true });
 expect(mockReplace).not.toHaveBeenCalled();
});
it('opens logout confirmation over Choose Workspace without another settings screen', async () => {
 const signOut = jest.fn(async () => ({ ok: true as const, data: undefined }));
 mount(<WorkspaceSelectionScreen />, { ...progressPreviewServices, auth: { ...progressPreviewServices.auth, signOut } });
 expect(screen.getByText('Choose Workspace')).toBeTruthy();
 expect(screen.queryByLabelText('Back')).toBeNull();
 toggleMenu('Settings');
 fireEvent.press(await screen.findByLabelText('Log Out'));
 expect(screen.getByText('Log out of BAYA?', { includeHiddenElements: true })).toBeTruthy();
 expect(screen.getByText('Choose Workspace', { includeHiddenElements: true })).toBeTruthy();
 expect(mockPush).not.toHaveBeenCalled();
 expect(signOut).not.toHaveBeenCalled();
 fireEvent.press(screen.getByLabelText('CANCEL', { includeHiddenElements: true }));
 expect(screen.getByText('Choose Workspace')).toBeTruthy();
});
it('shows synchronized data and opens the correct learner within its workspace',async()=>{
 mount(<MentorDashboard id="class-one" />);await screen.findByText('Jomarie');
 expect(screen.getByText('44%')).toBeTruthy();
 fireEvent.press(screen.getByLabelText("View Jomarie's progress"));
 expect(mockPush).toHaveBeenCalledWith({pathname:'/mentor/learner-progress',params:{workspaceId:'class-one',profileId:'preview-learner'}});
});
it('shows a true empty state only after a successful read',async()=>{
 const data=await progressPreviewServices.progress.dashboard('preview');if(!data.ok)throw new Error();
 mount(<MentorDashboard id="class" />,{...progressPreviewServices,progress:{...progressPreviewServices.progress,dashboard:async()=>({ok:true,data:{...data.data,learners:[],learnerCount:0,lastSyncedAt:null}})}});
 expect(screen.queryByText('No learners yet')).toBeNull();await screen.findByText('No learners yet');
});
it('does not render mock learners or zero progress when the provider is unavailable',async()=>{
 mount(<MentorDashboard id="class" />,pendingCloudServices);await screen.findByText(/not available yet/);
 expect(screen.queryByText('Jomarie')).toBeNull();expect(screen.queryByText('No learners yet')).toBeNull();
});
it('shows topic detail from the service',async()=>{
 mount(<LearnerProgressDetail workspaceId="class" profileId="profile" />);
 await screen.findByText('4 of 9 topics completed · 44%');
 expect(screen.getByText('Kasaysayan at Kahalagahan ng Baybayin')).toBeTruthy();
 expect(screen.getAllByText('Not completed').length).toBe(5);
});
it('opens and toggles options without reloading the dashboard, then navigates with workspace context',async()=>{
 const dashboard=jest.fn(progressPreviewServices.progress.dashboard);
 mount(<MentorDashboard id="class-one" />,{...progressPreviewServices,progress:{...progressPreviewServices.progress,dashboard}});
 await screen.findByText('Jomarie');
 expect(screen.queryByLabelText('Manage Workspace')).toBeNull();
 toggleMenu();
 await screen.findByLabelText('Manage Workspace');
 toggleMenu();
 await waitFor(()=>expect(screen.queryByLabelText('Manage Workspace')).toBeNull());
 expect(dashboard).toHaveBeenCalledTimes(1);
 toggleMenu();
 fireEvent.press(await screen.findByLabelText('Manage Workspace'));
 expect(mockPush).toHaveBeenCalledWith({pathname:'/mentor/workspaces/manage',params:{id:'class-one'}});
 await waitFor(()=>expect(screen.queryByLabelText('Manage Workspace')).toBeNull());
});
it('confirms logout directly in the menu, supports cancellation, and signs out before navigating',async()=>{
 const signOut=jest.fn(async()=>({ok:true as const,data:undefined}));
 mount(<MentorDashboard id="class" />,{...progressPreviewServices,auth:{...progressPreviewServices.auth,signOut}});
 await screen.findByText('Jomarie');
 toggleMenu();
 fireEvent.press(await screen.findByLabelText('Switch Workspace'));
 expect(mockReplace).toHaveBeenCalledWith('/mentor/workspaces');
 toggleMenu();
 fireEvent.press(await screen.findByLabelText('Log Out'));
 expect(screen.getByText('Log out of BAYA?',{includeHiddenElements:true})).toBeTruthy();
 expect(mockPush).not.toHaveBeenCalledWith('/mentor/settings');
 expect(signOut).not.toHaveBeenCalled();
 fireEvent.press(screen.getByLabelText('CANCEL',{includeHiddenElements:true}));
 expect(signOut).not.toHaveBeenCalled();
 toggleMenu();
 fireEvent.press(await screen.findByLabelText('Log Out'));
 fireEvent.press(screen.getByLabelText('YES, LOG OUT',{includeHiddenElements:true}));
 await waitFor(()=>expect(mockReplace).toHaveBeenCalledWith('/mentor'));
 expect(signOut).toHaveBeenCalledTimes(1);
});
it('dismisses on native outside press and back without changing data',async()=>{
 mount(<MentorDashboard id="class" />);
 await screen.findByText('Jomarie');
 toggleMenu();
 fireEvent.press(await screen.findByTestId('action-menu-backdrop'));
 await waitFor(()=>expect(screen.queryByLabelText('Manage Workspace')).toBeNull());
 toggleMenu();
 await screen.findByLabelText('Manage Workspace');
 fireEvent(screen.UNSAFE_getByType(Modal),'requestClose');
 await waitFor(()=>expect(screen.queryByLabelText('Manage Workspace')).toBeNull());
 expect(screen.getByText('Jomarie')).toBeTruthy();
});
it('deduplicates refresh, keeps existing data visible, and toasts only the actual result',async()=>{
 const initial=await progressPreviewServices.progress.dashboard('class');
 let finish!:(value:typeof initial)=>void;
 const dashboard=jest.fn().mockResolvedValueOnce(initial).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 mount(<MentorDashboard id="class" />,{...progressPreviewServices,progress:{...progressPreviewServices.progress,dashboard}});
 await screen.findByText('Jomarie');
 toggleMenu();
 fireEvent.press(await screen.findByLabelText('Refresh Progress'));
 fireEvent.press(screen.getByLabelText('Refresh Progress'));
 await waitFor(()=>expect(dashboard).toHaveBeenCalledTimes(2));
 expect(screen.getByText('Jomarie')).toBeTruthy();expect(mockToast).not.toHaveBeenCalled();
 await act(async()=>finish({ok:false,code:'offline'}));
 expect(screen.getByText('Jomarie')).toBeTruthy();
 expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('offline'),'error');
 dashboard.mockResolvedValueOnce(initial);
 fireEvent.press(screen.getByLabelText('Refresh Progress'));
 await waitFor(()=>expect(mockToast).toHaveBeenCalledWith('Progress refreshed.','success'));
});
