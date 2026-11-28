import React,{useEffect,useState} from 'react';
import {Animated,Easing,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useReducedMotionPreference} from '../../../hooks/useReducedMotionPreference';

export function RewardCelebration({rating,compact,tl}:{rating:number;compact:boolean;tl:boolean}){
 const reduced=useReducedMotionPreference();
 const [stars]=useState(()=>[new Animated.Value(1),new Animated.Value(1),new Animated.Value(1)]);
 useEffect(()=>{
   if(reduced){stars.forEach(s=>s.setValue(1));return;}
   stars.forEach(s=>s.setValue(0));
   const motion=Animated.stagger(145,stars.slice(0,rating).map(value=>Animated.timing(value,{toValue:1,duration:330,easing:Easing.out(Easing.cubic),useNativeDriver:false})));
   motion.start();return()=>motion.stop();
 },[rating,reduced,stars]);
 return <View testID="reward-celebration" style={{alignItems:'center',gap:3}} accessibilityLabel={(tl?'Marka':'Performance rating')+' '+rating+'/3'}>
 <View style={{flexDirection:'row',alignItems:'center',gap:8}}>{stars.map((v,i)=><Animated.View key={i} style={{transform:[{scale:i>=rating?1:v.interpolate({inputRange:[0,.72,1],outputRange:[.45,1.17,1]})}]}}>
 <Ionicons name={i<rating?'star':'star-outline'} color={i<rating?'#E6A000':'#B8AD94'} size={(compact?33:44)+(i===1?10:0)}/>
 {!reduced&&i<rating&&<Animated.Text accessible={false} style={{position:'absolute',right:-6,top:-6,color:'#C68100',opacity:v.interpolate({inputRange:[0,.45,1],outputRange:[0,1,0]})}}>✦</Animated.Text>}</Animated.View>)}</View>

 </View>;
}

export function EarnedStars({earned,tl}:{earned:number|null;tl:boolean}){
 const reduced=useReducedMotionPreference();
 const [counter]=useState(()=>new Animated.Value(0)),[display,setDisplay]=useState(0);
 useEffect(()=>{
   if(earned===null||reduced)return;
   counter.setValue(0);
   const id=counter.addListener(({value})=>setDisplay(Math.round(value)));
   const animation=Animated.timing(counter,{toValue:earned,duration:580,delay:120,useNativeDriver:false});
   animation.start();return()=>{animation.stop();counter.removeListener(id)};
 },[earned,reduced,counter]);
 return <Text testID="earned-stars-counter" accessibilityLabel={tl?'Mga nakuhang bituin':'Stars earned'} style={{fontWeight:'800',color:'#A95A00'}}>{earned===null?'…':`+${reduced?earned:display} ★`}</Text>;
}
