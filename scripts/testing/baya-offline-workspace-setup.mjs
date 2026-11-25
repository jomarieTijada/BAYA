import {createClient} from '@supabase/supabase-js';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
process.loadEnvFile('apps/mobile/.env');
const file=path.join(os.tmpdir(),'baya-offline-qa-mentor.json');const saved=JSON.parse(fs.readFileSync(file));
const make=()=>createClient(process.env.EXPO_PUBLIC_SUPABASE_URL,process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const mentor=make();const verified=await mentor.auth.verifyOtp({email:saved.email,token:process.env.BAYA_QA_OTP,type:'signup'});
if(verified.error)throw Error('Verification: '+verified.error.code);saved.mentorSession=verified.data.session;fs.writeFileSync(file,JSON.stringify(saved));
const {data:workspace,error}=await mentor.rpc('create_workspace',{p_name:'BAYA Offline QA '+new Date().toISOString().slice(0,10)});if(error)throw Error('Workspace: '+error.code);saved.workspace=workspace;fs.writeFileSync(file,JSON.stringify(saved));
const learner=make();const created=await learner.auth.signInAnonymously({options:{data:{display_name:'BAYA Offline QA Learner',account_type:'learner'}}});
if(created.error){console.log(JSON.stringify({mentorVerified:true,workspaceCreated:true,learnerError:created.error.code}));process.exitCode=1;}else{
 saved.learnerSession=created.data.session;fs.writeFileSync(file,JSON.stringify(saved));
 const joined=await learner.rpc('request_workspace_join',{p_code:workspace.workspace_code});if(joined.error)throw Error('Join: '+joined.error.code);
 const approved=await mentor.rpc('review_workspace_join_request',{p_request_id:joined.data.request.request_id,p_decision:'approved'});if(approved.error)throw Error('Approval: '+approved.error.code);
 saved.membership=approved.data.membership;fs.writeFileSync(file,JSON.stringify(saved));
 fs.writeFileSync('docs/verification/offline-first/workspace-setup.json',JSON.stringify({mentorVerified:true,workspace,joinStatus:joined.data.kind,approved:approved.data.request.status,learnerProfileId:approved.data.membership.learner_profile_id},null,2));console.log('Mentor verified; test workspace created; new test learner approved.');
}
