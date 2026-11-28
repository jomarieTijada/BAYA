import React,{useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {BayaDialog} from '../../ui/BayaDialog';
import {useLocalization} from '../../../localization/LocalizationProvider';
import {achievementCatalog} from '../../../content/achievements/achievementCatalog';
import {approvedCurriculum} from '../../../content/approvedCurriculum';
import {findCheckpoint,questionPlacements} from '../../../content/characterActivities/checkpoints';
import type {LedgerRow,Wallet} from '../../../modules/rewards/wallet';

export function entryLabel(row:LedgerRow,tl:boolean) {
 const lang=tl?'tl':'en';
 switch(row.kind){
 case 'achievement':return achievementCatalog.find(a=>a.id===row.source_id)?.title[lang]??row.source_id;
 case 'topic':return approvedCurriculum.flatMap(m=>m.topics).find(t=>t.id===row.source_id)?.title??row.source_id;
 case 'module':return approvedCurriculum.find(m=>m.id===row.source_id)?.title??row.source_id;
 case 'checkpoint':return findCheckpoint(row.source_id)?.title[lang]??row.source_id;
 case 'hint':return (tl?'Pahiwatig':'Hint')+' · '+(findCheckpoint(row.checkpoint_id??'')?.title[lang]??'');
 default:return (row.kind==='writing'?(tl?'Pagsulat':'Writing'):(tl?'Pagtutugma':'Matching'))+' · '+(questionPlacements.find(p=>p.questionId===row.source_id)?.question.prompt??row.source_id);
 }
}
export function WalletButton({wallet}:{wallet:Wallet|null}){
 const [open,setOpen]=useState(false);
 const tl=useLocalization().language==='tl',title=tl?'Iyong mga Bituin':'Your Stars';
 return <><Pressable testID="star-wallet-button" accessibilityRole="button" accessibilityLabel={title+' · '+(wallet?.balance??'…')} onPress={()=>setOpen(true)} style={{borderRadius:20,backgroundColor:'#FFF1BD',paddingHorizontal:12,paddingVertical:7}}>
 <Text style={{fontWeight:'800',color:'#764800'}}>★ {wallet?.balance??'…'}</Text></Pressable>
 {open&&<BayaDialog visible title={title} description={tl?'Kumita ng mga bituin habang natututo. Gamitin ang mga ito para sa pahiwatig.':'Earn Stars by learning. Use them for a hint when you need one.'} primaryAction={{label:tl?'Isara':'Close',onPress:()=>setOpen(false)}} onDismiss={()=>setOpen(false)}>
 {wallet?<View style={{gap:8}}><Text style={{fontSize:22,fontWeight:'800',color:'#855000'}}>{tl?'Magagamit':'Available'} · ★ {wallet.balance}</Text>
 <Text>{tl?'Kabuuang nakuha':'Lifetime earned'} +{wallet.earned}   ·   {tl?'Ginamit':'Spent'} −{wallet.spent}</Text>
 <Text style={{fontWeight:'700'}}>{tl?'Mga huling transaksiyon':'Recent transactions'}</Text>
 {!wallet.rows.length&&<Text>{tl?'Tapusin ang isang paksa para kumita ng mga bituin.':'Complete a topic to earn your first Stars.'}</Text>}
 {wallet.rows.slice(0,30).map(r=><View key={r.id} style={{flexDirection:'row',gap:8,justifyContent:'space-between'}}><Text style={{flex:1}}>{entryLabel(r,tl)}</Text><Text>{r.amount>0?'+':''}{r.amount} ★</Text></View>)}</View>:<Text>{tl?'Hindi pa mabasa ang pitaka.':'Wallet data is unavailable.'}</Text>}</BayaDialog>}</>;
}
