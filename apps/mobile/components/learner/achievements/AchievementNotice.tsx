import React, {useEffect, useRef, useState} from 'react';
import {Animated, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {usePathname} from 'expo-router';
import {getReadyDatabase} from '../../../database/lifecycle';
import {achievementOwner, subscribeAchievements} from '../../../modules/achievements/service';
import {achievementCatalog} from '../../../content/achievements/achievementCatalog';
import {useLocalization} from '../../../localization/LocalizationProvider';
import {useReducedMotionPreference} from '../../../hooks/useReducedMotionPreference';

type Notice = {owner:string; ids:string[]; stars:number; sequence:number};

export function AchievementNotice() {
  const {language}=useLocalization(), tl=language==='tl';
  const path=usePathname();
  const [notice,setNotice]=useState<Notice|null>(null);
  const [motion]=useState(()=>new Animated.Value(0));
  const reduced=useReducedMotionPreference();
  const last=useRef<{owner:string;id:number} | null>(null);
  useEffect(()=>{
    let live=true;
    let pending=Promise.resolve();
    const refresh=()=>{
      pending=pending.then(async()=>{
        if(!live)return;
        const db=await getReadyDatabase(), owner=await achievementOwner(db);
        if(!live)return;
        if(!owner){last.current=null;setNotice(null);return;}
        const previous=last.current?.owner===owner?last.current.id:null;
        if(previous===null)setNotice(null);
        const result=await db.getFirstAsync<{id:number;stars:number}>(
          'SELECT COALESCE(MAX(id),0) id, COALESCE(SUM(CASE WHEN id>? AND amount>0 THEN amount ELSE 0 END),0) stars FROM learner_star_transactions WHERE learner_id=?',
          [previous??Number.MAX_SAFE_INTEGER,owner]);
        const rows=await db.getAllAsync<{achievement_id:string}>('SELECT achievement_id FROM learner_achievements WHERE learner_id=? AND notified=0 ORDER BY unlocked_at',[owner]);
        if(!live || !result)return;
        last.current={owner,id:result.id};
        const ids=rows.map(r=>r.achievement_id);
        if(!ids.length&&!result.stars)return;
        setNotice({owner,ids,stars:result.stars,sequence:Date.now()});
        if(ids.length)await db.runAsync('UPDATE learner_achievements SET notified=1 WHERE learner_id=? AND achievement_id IN ('+ids.map(()=>'?').join(',')+')',[owner,...ids]);
      }).catch(error=>console.warn('[BAYA] Reward popup unavailable',error));
    };
    refresh();
    const unsubscribe=subscribeAchievements(refresh);
    return ()=>{live=false;unsubscribe();};
  },[path]);
  useEffect(()=>{
    if(!notice)return;
    motion.setValue(reduced?1:0);
    const animation=Animated.spring(motion,{toValue:1,speed:22,bounciness:9,useNativeDriver:false});
    if(!reduced)animation.start();
    const exit=Animated.timing(motion,{toValue:0,duration:180,useNativeDriver:false});
    const fade=setTimeout(()=>{if(!reduced)exit.start();},1820);
    const timer=setTimeout(()=>setNotice(null),2000);
    return ()=>{clearTimeout(timer);clearTimeout(fade);animation.stop();exit.stop();};
  },[notice,motion,reduced]);
  if(!notice)return null;
  const count=notice.ids.length;
  const title=count===1?achievementCatalog.find(a=>a.id===notice.ids[0])?.title[language]:count?
    (tl?count+' bagong nakamit':count+' new achievements unlocked!'):(tl?'Mga bituing nakuha':'Stars earned');
  return <View pointerEvents="none" style={{position:'absolute',top:8,left:8,right:8,zIndex:999,alignItems:'center'}}>
    <Animated.View testID="reward-popup" accessibilityLiveRegion="polite" style={{maxWidth:'95%',flexDirection:'row',alignItems:'center',gap:9,paddingVertical:7,paddingHorizontal:14,borderRadius:30,backgroundColor:'#FFF7E7',borderWidth:1,borderColor:'#F3B36A',opacity:motion,transform:[{translateY:motion.interpolate({inputRange:[0,1],outputRange:[-20,0]})}]}}>
      <Animated.View style={{transform:[{scale:motion.interpolate({inputRange:[0,1],outputRange:[0.4,1]})}]}}><Ionicons name={count?'trophy':'star'} size={23} color="#DD8508"/></Animated.View>
      <View style={{flexShrink:1}}>{count===1&&<Text style={{fontSize:10,color:'#96500D',fontWeight:'700'}}>{tl?'Bagong nakamit':'Achievement unlocked'}</Text>}<Text style={{color:'#432A17',fontWeight:'800'}}>{title}</Text></View>
      {notice.stars>0&&<Animated.View style={{flexDirection:'row',alignItems:'center',gap:3,transform:[{scale:motion.interpolate({inputRange:[0,0.7,1],outputRange:[0.45,1.2,1]})}]}}><Ionicons name="star" size={15} color="#DD8508"/><Text style={{color:'#9A5000',fontWeight:'800'}}>+{notice.stars}</Text></Animated.View>}
    </Animated.View>
  </View>;
}
