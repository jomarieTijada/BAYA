import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Colors } from '../../../constants/theme';
import { targetOrder, type MatchingBoard, type MatchingPair } from '../../../content/characterActivities/matching';
import { questionRecording } from '../../../content/characterActivities';
import type { SetAttempt } from '../../../modules/characterActivities/assessment';
import { characterActivityService as service } from '../../../database/services/characterActivityService';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { usePronunciation } from '../../../modules/audio/usePronunciation';
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference';
import { useKeyboardFocus } from '../../../hooks/useKeyboardFocus';
import { AppButton } from '../../ui/AppButton';
import { BayaMascot } from '../../branding/BayaMascot';
import { StorySpeechBubble } from '../story/StorySpeechBubble';
import { AppIcon } from '../../ui/AppIcon';
import { WritingHelpGuide, type HelpGuideStep } from '../writing/WritingHelpGuide';
import { Glyph } from './QuestionParts';

function Card({ pair, size, index, disabled, selected, wrong, misses, onSelect, onDrag, onDrop }: {
 pair: MatchingPair; size:number; index:number; disabled:boolean; selected:boolean; wrong:boolean; misses:number;
 onSelect:()=>void; onDrag:()=>void; onDrop:(x:number,y:number)=>void;
}) {
 const reduced=useReducedMotionPreference();
 const {focused,...focus}=useKeyboardFocus();
 const [offset]=useState(()=>new Animated.ValueXY());
 const [shake]=useState(()=>new Animated.Value(0));
 const [moving,setMoving]=useState(false);
 const callbacks=useRef({disabled,onDrag,onDrop});
 useEffect(()=>{callbacks.current={disabled,onDrag,onDrop};},[disabled,onDrag,onDrop]);
 useEffect(()=>{
  if(!wrong||reduced)return;
  const animation=Animated.sequence([8,-8,6,-6,0].map(toValue=>Animated.timing(shake,{toValue,duration:65,useNativeDriver:false})));
  animation.start();return()=>animation.stop();
 },[wrong,misses,reduced,shake]);
 // These refs are read only by gesture events.
 // eslint-disable-next-line react-hooks/refs
 const pan=useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponder:(_,g)=>!callbacks.current.disabled&&Math.abs(g.dx)+Math.abs(g.dy)>7,
  onPanResponderGrant:()=>{setMoving(true);callbacks.current.onDrag();},
  onPanResponderMove:(_,g)=>offset.setValue({x:g.dx,y:g.dy}),
  onPanResponderRelease:(_,g)=>{callbacks.current.onDrop(g.moveX,g.moveY);offset.setValue({x:0,y:0});setMoving(false);},
  onPanResponderTerminate:()=>{offset.setValue({x:0,y:0});setMoving(false);},
  onPanResponderTerminationRequest:()=>false,
 }),[offset]);
 return <Animated.View {...pan.panHandlers} style={{transform:[...offset.getTranslateTransform(),{translateX:shake},{scale:moving&&!reduced?1.03:1}]}}>
  <Pressable testID={`match-source-${pair.id}`} accessibilityRole="button" accessibilityLabel={`Character card ${index+1}`} accessibilityState={{selected,disabled}} disabled={disabled} onPress={onSelect} {...focus}
   {...(Platform.OS==='web'?{onKeyDown:(event:React.KeyboardEvent)=>{if(event.target===event.currentTarget&&!disabled&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();if(!event.repeat)onSelect();}}}:{})}
   style={[s.card,{width:size,height:size},selected&&s.selected,focused&&{borderColor:Colors.focus},wrong&&s.wrong,moving&&s.lift]}>
   <Glyph glyph={pair.glyph} label={`Character ${index+1}`} size={Math.round(size*.72)}/>
  </Pressable>
 </Animated.View>;
}
function Sound({pair,index,onPlayed}:{pair:MatchingPair;index:number;onPlayed:()=>void}){
 const player=usePronunciation(questionRecording(pair.question));
 const {language}=useLocalization();const tl=language==='tl';
 useEffect(()=>{if(player.phase==='playing')onPlayed();},[player.phase,onPlayed]);
 return <View><AppButton compact icon="sound" label="" accessibilityLabel={`${tl?'Pakinggan ang tunog':'Play sound'} ${index+1}`} disabled={player.loading} onPress={player.pronounce} tone="outlinePrimary" style={{width:40,minHeight:44,paddingHorizontal:4}}/>{player.error&&<Text accessibilityRole="alert">{tl?'Hindi tumugtog. Subukan muli.':'Could not play. Try again.'}</Text>}</View>;
}
export function MatchingChallenge({board,attempt,onChange}:{board:MatchingBoard;attempt:SetAttempt;onChange:(a:SetAttempt)=>void}){
 const {language}=useLocalization(),tl=language==='tl';
 const {width,height}=useWindowDimensions();const compact=height<500,portrait=width<height;
 const reduced=useReducedMotionPreference();
 const index=Math.max(0,Math.min(board.pairs.length-1,attempt.cursor-board.start)),current=board.pairs[index];
 const saved=attempt.responses.find(r=>r.questionId===current.id),legacy=saved?.answer.kind==='matching-v2';
 const [won,setWon]=useState(saved?.correct===true||legacy);
 const [wrong,setWrong]=useState(''),[misses,setMisses]=useState(0),[selected,setSelected]=useState<string>();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[help,setHelp]=useState(false),[heard,setHeard]=useState(false);
 const [rotation,setRotation]=useState(0);
 const [switching,setSwitching]=useState(false);
 const switchLock=useRef(false);
 const [shuffle]=useState(()=>new Animated.Value(0));
 const [cyclingCard,setCyclingCard]=useState<string>();
 const [tucked,setTucked]=useState(false);
 useEffect(()=>()=>shuffle.stopAnimation(),[shuffle]);
 const lock=useRef(false),receiver=useRef<View>(null),bounds=useRef({x:0,y:0,w:0,h:0});
 const deckTarget=useRef<View>(null),switchTarget=useRef<View>(null),collectionTarget=useRef<View>(null);
 const audio=current.interaction===1,pending=current.pending;
 const cards=useMemo(()=>targetOrder(board,attempt.id),[board,attempt.id]);
 const completeIds=board.pairs.slice(0,legacy?board.pairs.length:index+(won?1:0)).map(p=>p.id);
 const remaining=[...cards.slice(rotation),...cards.slice(0,rotation)].filter(p=>!completeIds.includes(p.id));
 const size=portrait?125:compact?Math.min(180,height-190):230,step=compact||portrait?18:24;
 const mini=portrait||height<350?50:62;
 const mascotSize=Math.min(portrait?width*.8:width*.49,compact?height*.78:400);
 const measureReceiver=()=>receiver.current?.measureInWindow((x,y,w,h)=>{bounds.current={x,y,w,h};});
 const hit=(x:number,y:number)=>{const b=bounds.current;return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;};
 function switchCard(){
  if(switchLock.current||busy||won||remaining.length<2)return;
  const nextRotation=cards.findIndex(p=>p.id===remaining[remaining.length-1].id);
  setSelected(undefined);setWrong('');
  if(reduced){setRotation(nextRotation);return;}
  switchLock.current=true;setSwitching(true);
  setCyclingCard(remaining[remaining.length-1].id);setTucked(false);shuffle.setValue(0);
  Animated.timing(shuffle,{toValue:1,duration:220,useNativeDriver:false}).start(({finished})=>{
   if(!finished)return;
   // Lower only the outgoing card once it has cleared the stack.
   setTucked(true);
   Animated.timing(shuffle,{toValue:2,duration:240,useNativeDriver:false}).start(({finished:returned})=>{
    if(!returned)return;
    setRotation(nextRotation);setCyclingCard(undefined);setTucked(false);
    shuffle.setValue(0);switchLock.current=false;setSwitching(false);
   });
  });
 }
 const onPlayed=useCallback(()=>setHeard(true),[]);
 async function give(id:string){
  if(lock.current||switchLock.current||won||pending||(audio&&!heard))return;
  lock.current=true;setBusy(true);setError('');setWrong('');setHelp(false);
  try{
   // Only the first response contributes to the score; retries remain practice.
   if(!saved)onChange(await service.submit(attempt,current.id,{kind:'mascot-match-v3',targetQuestionId:id,boardId:board.id,boardStart:board.start,audioPlayed:heard}));
   if(id===current.id){setWon(true);setSelected(undefined);}else{setWrong(id);setMisses(n=>n+1);setSelected(id);}
  }catch{setError(tl?'Hindi na-save. Subukan muli.':'Could not save. Try again.');}
  finally{lock.current=false;setBusy(false);}
 }
 const next=useCallback(async()=>{
  if(lock.current)return;lock.current=true;setBusy(true);
  try{const a=pending&&!saved?await service.submit(attempt,current.id,{kind:'unavailable',reason:'recording-pending-validation'}):attempt;onChange(await service.advance(a));}
  catch{setError(tl?'Hindi na-save. Subukan muli.':'Could not save. Try again.');}
  finally{lock.current=false;setBusy(false);}
 },[attempt,current.id,onChange,pending,saved,tl]);
 useEffect(()=>{if((!won&&!pending)||error)return;const timer=setTimeout(()=>void next(),pending?3500:1800);return()=>clearTimeout(timer);},[won,pending,next,error]);
 const prompt=pending?(tl?'Hinihintay ang recording. Walang bawas sa iskor.':'This recording is awaiting validation. No points lost.')
  :won?(tl?'Tama!':'Correct!'):wrong?(tl?'Subukan muli! Hanapin ang katugmang card.':'Try again! Find the matching card.')
  :audio?(tl?'Pakinggan! Aling karakter ito?':'Listen! Which character is it?'):(tl?`Nasaan ang ${current.reading}?`:`Can you find ${current.reading}?`);
 const guideSteps:HelpGuideStep[]=[
  {target:'reference',emphasis:'',message:tl?'Tingnan ang karakter sa card.':'Look at the character on the card.',icon:'lessons'},
  {target:'action',emphasis:'',message:tl?'Pindutin ang paikot na arrow upang palitan ang card.':'Tap the circular arrows to switch cards.',icon:'sync'},
  {target:'canvas',emphasis:'',message:tl?'I-drag ang katugmang card kay BAYA. Maaari ring i-tap ang card, saka si BAYA.':'Drag the matching card to BAYA. You can also tap a card, then tap BAYA.',icon:'swipeHand'},
  {target:'stars',emphasis:'',message:tl?'Dito mapupunta ang tamang card. Ang unang sagot ang binibilang sa iskor; maaari kang sumubok muli.':'Correct cards appear here. Your first answer counts toward your score; you can retry to practice.',icon:'check'},
 ];
 return <View style={s.stage} testID="matching-board">
  <Pressable style={s.instructions} accessibilityRole="button" accessibilityLabel={tl?'Panuto':'Instructions'} onPress={()=>setHelp(h=>!h)}><Text style={s.hint}>{'\u24D8 '}{tl?'Panuto':'Instructions'}</Text></Pressable>
  <View ref={collectionTarget} collapsable={false} style={[s.collection,{width:mini}]} testID="matched-pairs" accessibilityLiveRegion="polite">{board.pairs.filter(p=>completeIds.includes(p.id)).map(p=><View key={p.id} style={[s.collected,{width:mini,height:mini}]}><Glyph glyph={p.glyph} label={p.reading} size={mini-22}/><Text style={s.pairLabel}>{p.reading}</Text></View>)}</View>
  <View style={[s.playArea,{paddingLeft:mini+44},portrait&&{flexDirection:'column',gap:4,paddingTop:42,paddingLeft:0}]}>
   <View ref={deckTarget} collapsable={false} style={[s.deck,{height:size+step*(board.pairs.length-1),width:size+9*(board.pairs.length-1)}]} testID="character-deck">
    <View style={{width:'100%',height:'100%'}} pointerEvents={switching?'none':'auto'}>
    {!pending&&remaining.map((p,i)=>{
     const cycling=p.id===cyclingCard;
     const slide=shuffle.interpolate({inputRange:[0,1,2],outputRange:cycling?[0,size+12,-i*9]:[0,0,9]});
     const rise=shuffle.interpolate({inputRange:[0,1,2],outputRange:cycling?[0,-8,-i*step]:[0,0,step]});
     return <Animated.View key={p.id} style={{position:'absolute',top:i*step,left:i*9,width:size,zIndex:cycling?(tucked?0:30):selected===p.id?30:i+1,transform:switching?[{translateX:slide},{translateY:rise},{rotate:cycling?shuffle.interpolate({inputRange:[0,1,2],outputRange:['0deg','6deg','0deg']}):'0deg'}]:[]}}>
     <Card pair={p} size={size} index={i} selected={selected===p.id} disabled={busy||won||switching} wrong={wrong===p.id} misses={misses}
      onSelect={()=>{setSelected(p.id);setWrong('');}} onDrag={()=>{setSelected(p.id);setWrong('');measureReceiver();}}
      // Gesture callback runs on release, never during render.
      // eslint-disable-next-line react-hooks/refs
      onDrop={(x,y)=>{if(hit(x,y))void give(p.id);}}/>
    </Animated.View>;})}
    </View>
    {!pending&&remaining.length>1&&<Pressable ref={switchTarget} testID="switch-card" accessibilityRole="button" accessibilityLabel={tl?'Palitan ang card':'Switch card'} disabled={busy||won||switching} onPress={switchCard} style={s.switchCard}><AppIcon name="sync" size={24} color="accent"/></Pressable>}
   </View>
   <View style={[s.guide,{maxWidth:portrait?width-50:410}]}>
    <View style={{width:'100%',zIndex:3}}><StorySpeechBubble takeawayText={prompt} bottomTail centered compact effectiveLandscape={false} isDesktop={false} isTablet={false} stackGuide={false} floating maxHeight={compact?88:120}>
     {audio&&!pending?<View style={{flexDirection:'row',alignItems:'center',gap:10}}><Sound pair={current} index={index} onPlayed={onPlayed}/><Text style={{flex:1,fontSize:16,lineHeight:22,fontWeight:'700',textAlign:'center',color:Colors.textPrimary}}>{prompt}</Text></View>:undefined}
    </StorySpeechBubble></View>
    <View ref={receiver} collapsable={false} style={{marginTop:12}}>
     <Pressable testID="baya-drop-target" accessibilityRole="button" accessibilityLabel={tl?'Ibigay ang card kay BAYA':'Give selected card to BAYA'} accessibilityState={{disabled:busy||won}} disabled={busy||won} onPress={()=>{if(selected)void give(selected);}} style={{outlineWidth:0,height:portrait?165:compact?height*.56:300,overflow:'hidden'}}>
      <BayaMascot key={won?'wave':'idle'} size={mascotSize} crop="upperBody" state={won?'greeting':'idle'} autoplay={won&&!reduced} loop={false} decorative/>
     </Pressable>
    </View>
   </View>
  </View>
  {help&&<WritingHelpGuide title={tl?'Gabay sa pagtutugma':'How to match'} customSteps={guideSteps} targets={{reference:deckTarget,canvas:receiver,action:switchTarget,stars:collectionTarget}} phase="ready" onClose={()=>setHelp(false)}/>}
  {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  {!!error&&(won||pending)&&<Pressable accessibilityRole="button" onPress={()=>{setError('');void next();}} style={s.retry}><Text>{tl?'Subukan muli':'Retry saving'}</Text></Pressable>}
  <View accessibilityLiveRegion="polite" style={{height:0,overflow:'hidden'}}><Text>{won?(tl?'Tamang tugma!':'Correct match!'):wrong?(tl?'Hindi pa. Subukan muli.':'Not quite. Try again.'):''}</Text></View>
 </View>;
}
const s=StyleSheet.create({
 stage:{flex:1,minHeight:0,width:'100%',maxWidth:1100,alignSelf:'center',paddingHorizontal:18},
 instructions:{position:'absolute',left:12,top:2,minHeight:32,justifyContent:'center',zIndex:40},hint:{fontSize:13,color:Colors.textPrimary},
 collection:{position:'absolute',left:12,top:44,gap:6,zIndex:2},collected:{alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#289C47',borderRadius:10,backgroundColor:'#BCEFA9'},pairLabel:{fontSize:12,fontWeight:'700',color:'#175C2B'},
 playArea:{flex:1,minHeight:0,flexDirection:'row',alignItems:'center',justifyContent:'space-evenly',gap:48},deck:{flexShrink:0,overflow:'visible',zIndex:5},guide:{flex:1,alignSelf:'stretch',width:'100%',alignItems:'center',justifyContent:'flex-end'},
 switchCard:{position:'absolute',left:-56,top:'50%',marginTop:-22,width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:22,backgroundColor:'#FFE2BC',zIndex:40},switchText:{fontSize:13,fontWeight:'700',color:'#863B09'},
 card:{alignItems:'center',justifyContent:'center',backgroundColor:Colors.surface,borderColor:Colors.border,borderWidth:2,borderRadius:20,outlineWidth:0,userSelect:'none',...({touchAction:'none'} as object)},selected:{borderColor:Colors.accent,backgroundColor:'#FFF6E7'},wrong:{borderColor:'#CB3D36',backgroundColor:'#FFF0ED'},lift:{boxShadow:'0 8px 20px #0003'},error:{position:'absolute',left:90,bottom:6,color:'#CB3D36'},retry:{position:'absolute',right:12,bottom:10,zIndex:10},
});
