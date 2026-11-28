import React,{useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {BayaDialog} from '../../ui/BayaDialog';
import {useLocalization} from '../../../localization/LocalizationProvider';
import {getReadyDatabase} from '../../../database/lifecycle';
import {readWallet} from '../../../modules/rewards/wallet';
import {rewardPolicy} from '../../../modules/rewards/policy';
import {redeemHint,resolveHint,savedHint,type Hint} from '../../../modules/rewards/hints';
import type {CharacterQuestion} from '../../../content/characterActivities';
import type {SetAttempt} from '../../../modules/characterActivities/assessment';

export function HintButton({attempt,question,disabled}:{attempt:SetAttempt;question:CharacterQuestion;disabled:boolean}){
 const tl=useLocalization().language==='tl', cost=rewardPolicy.hintCost;
 const [open,setOpen]=useState(false),[hint,setHint]=useState<Hint|null>(null),[balance,setBalance]=useState<number|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 const buying=useRef(false);
 const available=resolveHint(question);
 useEffect(()=>{
   let live=true;
   async function load(){const db=await getReadyDatabase();const [wallet,prior]=await Promise.all([readWallet(attempt.profileId,db),savedHint(db,attempt,question.id)]);
     if(live){setBalance(wallet.balance);setHint(prior);}}
   void load().catch(()=>{if(live)setError(true)});return()=>{live=false};
 },[attempt,question.id]);
 const close=()=>setOpen(false);
 const buy=async()=>{
   if(buying.current)return;
   buying.current=true;setBusy(true);setError(false);
   try{const clue=await redeemHint(attempt,question.id);setHint(clue);setBalance((await readWallet(attempt.profileId)).balance);}
   catch{setError(true);try{setBalance((await readWallet(attempt.profileId)).balance)}catch{/* Wallet unavailable. */}}
   finally{buying.current=false;setBusy(false)}
 };
 const label=hint?(tl?'Tingnan ang pahiwatig':'View hint'):(tl?'Pahiwatig':'Hint')+' · '+cost+' ★';
 if(!rewardPolicy.hintsEnabled)return null;
 const enough=balance!==null&&balance>=cost;
 const inactive=disabled||!available||balance===null;
 return <><Pressable testID="assessment-hint" accessibilityRole="button" accessibilityLabel={label}
   accessibilityState={{disabled:inactive}} disabled={inactive} onPress={()=>setOpen(true)}
   style={({pressed})=>({width:44,height:44,alignSelf:'flex-end',alignItems:'center',justifyContent:'center',opacity:inactive?0.62:pressed?0.8:1})}>
   <View style={{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:'#FFF2D4',borderWidth:1.5,borderColor:'#E8AD5C'}}>
     <Ionicons name="bulb" size={22} color="#B96808"/>
   </View>
   <View style={{position:'absolute',right:0,top:0,minWidth:19,height:19,paddingHorizontal:3,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:'#A74A08',borderWidth:1.5,borderColor:'#FFFDF7'}}>
     <Text style={{fontSize:11,lineHeight:14,fontWeight:'800',color:'white'}}>{hint?0:cost}</Text>
   </View>
 </Pressable>
 {open&&<BayaDialog visible title={hint?(tl?'Pahiwatig':'Your hint'):!enough?(tl?'Kulang ang mga Bituin':'Not enough Stars'):(tl?'Kailangan ng kaunting tulong?':'Need a little help?')}
 description={hint?hint[tl?'tl':'en']:enough?(tl?'Gumamit ng '+cost+' bituin para sa isang pahiwatig.':'Use '+cost+' Stars for one hint.'):(tl?'Kailangan ng '+cost+' bituin. Maaari mo pa ring tapusin ang gawain!':'You need '+cost+' Stars. You can still finish the activity!')}
 detail={hint?undefined:(tl?'Iyong mga bituin':'Your Stars')+' · '+(balance??'…')+(enough?' → '+(balance!-cost):'')}
 onDismiss={close} primaryAction={hint||!enough?{label:tl?'Sige':'Got it',onPress:close}:{label:tl?'Gumamit ng Pahiwatig':'Use hint',onPress:()=>void buy(),loading:busy}}
 secondaryAction={!hint&&enough?{label:tl?'Huwag muna':'Not now',onPress:close}:undefined}>
 {error&&<Text accessibilityRole="alert">{tl?'Hindi mabasa ang pitaka. Subukan muli.':'Could not read your wallet. Try again.'}</Text>}</BayaDialog>}</>;
}
