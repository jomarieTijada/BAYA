/* eslint-disable @typescript-eslint/no-require-imports -- Jest factories resolve React inside the factory. */
import React from 'react';
import { render,screen,fireEvent } from '@testing-library/react-native';
import { MentorDashboard } from '../MentorDashboard';
import { LearnerProgressDetail } from '../LearnerProgressDetail';
import { CloudServicesContext,type CloudServices,pendingCloudServices } from '../../../modules/cloud/services';
import { progressPreviewServices } from '../../debug/workspaces/progressFixtures';
const mockPush=jest.fn();
jest.mock('expo-router',()=>({router:{push:(...args:unknown[])=>mockPush(...args),replace:jest.fn()},useFocusEffect:(cb:()=>void)=>require('react').useEffect(cb,[cb])}));
jest.mock('react-native-safe-area-context',()=>({SafeAreaView:require('react-native').View}));
jest.mock('../../ui/AppIcon',()=>({AppIcon:()=>null}));
const mount=(node:React.ReactNode,services:CloudServices=progressPreviewServices)=>render(<CloudServicesContext.Provider value={services}>{node}</CloudServicesContext.Provider>);
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
