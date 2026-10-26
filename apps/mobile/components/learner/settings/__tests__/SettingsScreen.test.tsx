/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factories resolve React inside the factory. */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../SettingsScreen';
import { WorkspaceSyncCard } from '../WorkspaceSyncCard';
import { CloudServicesContext, pendingCloudServices, type CloudServices } from '../../../../modules/cloud/services';
import { progressPreviewServices } from '../../../debug/workspaces/progressFixtures';
const mockPush=jest.fn();
const mockReplace=jest.fn();
jest.mock('expo-router',()=>({router:{push:(...args:unknown[])=>mockPush(...args),replace:(...args:unknown[])=>mockReplace(...args)},useFocusEffect:(cb:()=>void)=>require('react').useEffect(cb,[cb])}));
jest.mock('react-native-safe-area-context',()=>({SafeAreaView:require('react-native').View,useSafeAreaInsets:()=>({top:0,bottom:0,left:0,right:0})}));
jest.mock('../../../ui/AppIcon',()=>({AppIcon:()=>null}));
const mount=(services:CloudServices)=>render(<CloudServicesContext.Provider value={services}><SettingsScreen /></CloudServicesContext.Provider>);
beforeEach(()=>jest.clearAllMocks());
it('matches the independent wireframe and opens real join navigation',async()=>{
 mount({...progressPreviewServices,workspaces:{...progressPreviewServices.workspaces,memberships:async()=>({ok:true,data:[]})}});
 await screen.findByText('You are currently learning independently.');
 expect(screen.getByText('Workspace & Sync')).toBeTruthy();
 expect(screen.getByText('No Workspace Connected')).toBeTruthy();
 expect(screen.queryByLabelText('Learner cloud account')).toBeNull();
 expect(screen.queryByLabelText('Keeping your workspace access')).toBeNull();
 fireEvent.press(screen.getByLabelText('Join workspace'));
 expect(mockPush).toHaveBeenCalledWith('/learner/workspaces');
});
it('does not claim independence during loading or a failed membership read',async()=>{
 mount(pendingCloudServices);
 expect(screen.getByText('Checking your workspace…')).toBeTruthy();
 expect(screen.queryByText('No Workspace Connected')).toBeNull();
 expect((await screen.findAllByText(/not available yet/)).length).toBeGreaterThan(0);
 expect(screen.queryByText('You are currently learning independently.')).toBeNull();
});
it('uses actual membership name, code and sync time',async()=>{
 mount(progressPreviewServices);
 await screen.findByText('Baybayin Workshop A');
 expect(screen.getByText('BAYA-7K2P')).toBeTruthy();
 expect(screen.getByText('Connected')).toBeTruthy();
 expect(screen.getByLabelText('Sync learning progress')).toBeTruthy();
});
it('keeps the last confirmed time and never reports success on upload failure',async()=>{
 const memberships=await progressPreviewServices.workspaces.memberships();
 if(!memberships.ok)throw new Error();
 const sync=jest.fn(async()=>({ok:false as const,code:'network' as const}));
 mount({...progressPreviewServices,workspaces:{...progressPreviewServices.workspaces,memberships:async()=>({ok:true,data:memberships.data.map(m=>({...m,membership:{...m.membership,last_synced_at:null}}))})},progress:{...progressPreviewServices.progress,sync}});
 await screen.findByText('Not synchronized yet');
 fireEvent.press(screen.getByLabelText('Sync learning progress'));
 await screen.findByText('We couldn’t connect. Please try again.');
 expect(screen.getByText('Not synchronized yet')).toBeTruthy();
 expect(screen.queryByText('Learning progress synchronized.')).toBeNull();
});
it('prevents repeat sync submission and refreshes memberships only after confirmation',async()=>{
 let resolve!:(v:unknown)=>void;
 const sync=jest.fn(()=>new Promise<any>(r=>{resolve=r;}));
 const memberships=jest.fn(progressPreviewServices.workspaces.memberships);
 mount({...progressPreviewServices,workspaces:{...progressPreviewServices.workspaces,memberships},progress:{...progressPreviewServices.progress,sync}});
 await screen.findByText('Connected');
 fireEvent.press(screen.getByLabelText('Sync learning progress'));fireEvent.press(screen.getByLabelText('Sync learning progress'));
 expect(sync).toHaveBeenCalledTimes(1);expect(memberships).toHaveBeenCalledTimes(1);
 resolve({ok:true,data:{syncedAt:new Date().toISOString()}});
 await screen.findByText('Learning progress synchronized.');
 await waitFor(()=>expect(memberships).toHaveBeenCalledTimes(2));
});
it('does not enable a presentation-only sync button without a handler',()=>{
 render(<WorkspaceSyncCard initialInfo={{status:'connected',workspaceName:'Class',workspaceCode:'CODE'}} />);
 expect(screen.getByLabelText('Sync learning progress').props.accessibilityState.disabled).toBe(true);
});
it('explains pending approval without inviting another join or enabling sync',()=>{
 render(<WorkspaceSyncCard initialInfo={{status:'none'}} pending />);
 expect(screen.getByText('Your request is with your mentor.')).toBeTruthy();
 expect(screen.queryByLabelText('Join workspace')).toBeNull();
 expect(screen.queryByLabelText('Sync learning progress')).toBeNull();
});
