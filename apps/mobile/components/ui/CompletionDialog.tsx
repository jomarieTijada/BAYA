import React, { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Colors, FontFamily } from '../../constants/theme';
import { BayaDialog } from './BayaDialog';
import { AppIcon, type AppIconName } from './AppIcon';

export type CompletionMetric = { label: string; value: ReactNode; icon: AppIconName; tone: 'green' | 'blue' | 'orange' };
type Action = { label: string; onPress: () => void };
export type CompletionDialogProps = {
  badge: string; title: string; description: string; metrics: readonly CompletionMetric[];
  note?: string; error?: string; busy?: boolean;
  back: Action; next: Action; retry: Action;
  celebration?: ReactNode; rewardLine?:string; review?: ReactNode; reviewTitle?: string;
};

function CelebrationStar({size}: {size:number}) {
  return <Svg width={size} height={size} viewBox="0 0 100 100"><Polygon points="50,2 64,33 98,38 73,62 79,96 50,80 21,96 27,62 2,38 36,33" fill="#FFC21C" /></Svg>;
}

/** One screenshot-based completion presentation over the existing BAYA modal infrastructure. */
export function CompletionDialog({badge,title,description,metrics,note,error,busy=false,back,next,retry,review,reviewTitle,celebration,rewardLine}: CompletionDialogProps) {
  const {width,height}=useWindowDimensions();
  const [focused,setFocused]=useState('');
  const compact=width<600 || height<600;
  const landscape=width>height && height<500;
  const short=landscape && height<340;
  const tiles=landscape && !review && metrics.length===3 && width>560;

  return <BayaDialog visible title={review ? reviewTitle ?? title : title} variant="success" primaryAction={{label:next.label,onPress:next.onPress,loading:busy}}
    onDismiss={back.onPress} completionContent={<View style={{maxHeight:height-32,minHeight:0,paddingVertical:landscape?8:compact?12:24,paddingHorizontal:landscape?14:compact?14:24,gap:short?2:compact?8:16}}>
      <ScrollView style={{flexShrink:1,minHeight:0}} contentContainerStyle={{gap:short?1:landscape?6:compact?10:18}} testID="completion-content">
        <View style={{flexDirection:'column',gap:landscape?2:compact?10:18,alignItems:'stretch'}}>
        <View style={{gap:short?0:landscape?2:compact?8:14}}>
        <View style={{flexDirection:short?'row':'column',alignItems:'center',justifyContent:'center',gap:short?8:2}}>
        {celebration && <View key={review?'review-stars':'result-stars'}>{celebration}</View>}
        {!review && !celebration && <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" style={styles.stars} testID="completion-decorative-stars">
          <CelebrationStar size={compact?32:48}/><CelebrationStar size={compact?50:76}/><CelebrationStar size={compact?32:48}/>
        </View>}
        {!review && !landscape && <Text style={[styles.badge,compact&&{fontSize:landscape?10:13,paddingVertical:landscape?1:4} ]}>{badge}</Text>}</View>
        <Text accessibilityRole="header" style={[styles.heading,compact&&{fontSize:landscape?21:28,lineHeight:landscape?24:34}]}>{review ? reviewTitle : title}</Text>
        <Text nativeID="completion-description" style={[styles.description,compact&&{fontSize:short?12:16,lineHeight:short?14:21}]}>{description}</Text>
        </View>
        <View style={{minWidth:0}}>{review ?? <View style={tiles?{flexDirection:'row',gap:6,marginVertical:5}:styles.metrics} testID="completion-metrics">
          {metrics.map((metric,index)=><View key={metric.label} style={[styles.row,compact&&{padding:short?1:landscape?4:10,gap:8},!tiles&&index>0&&styles.divider,tiles&&{flex:1,minWidth:0,flexDirection:'column',alignItems:'center',backgroundColor:'#FFF7EA',borderRadius:12,borderWidth:1,borderColor:'#F1E3CC',paddingVertical:5,paddingHorizontal:3,gap:2}]}>
            {!tiles&&<View style={[styles.metricIcon,{backgroundColor:metric.tone==='green'?'#DCF3DE':metric.tone==='blue'?'#E2EFF7':'#FFECCC'},compact&&{width:landscape?21:32,height:landscape?21:32}]}><AppIcon name={metric.icon} color={metric.tone==='green'?'success':metric.tone==='blue'?'adventure':'accent'} size={landscape?14:compact?20:26}/></View>}
            <Text style={[styles.label,compact&&{fontSize:16,lineHeight:21},tiles&&{fontSize:12,lineHeight:15,flex:0,textAlign:'center'}]}>{metric.label}</Text>
            <Text style={[styles.value,{color:metric.tone==='green'?'#12803C':metric.tone==='blue'?'#0076A3':'#9C5900'},compact&&{fontSize:17,lineHeight:23},tiles&&{maxWidth:'100%',textAlign:'center'}]}>{metric.value}</Text>
          </View>)}
        </View>}</View></View>
        {!!rewardLine&&<Text accessibilityLiveRegion="polite" style={styles.note}>{rewardLine}</Text>}
        {!!note&&<Text style={styles.note}>{note}</Text>}
        {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </ScrollView>
      <View style={styles.actions} testID="completion-actions">
        {[{...back,key:'back',icon:'arrowLeft' as const,color:'#ED6684'},{...next,key:'next',icon:'arrowRight' as const,color:'#20AC5A'},{...retry,key:'retry',icon:'sync' as const,color:'#159CD9'}].map(action=>{
          const size=(landscape?40:compact?46:56)+(action.key==='next'?8:0);
          return <Pressable key={action.key} testID={`completion-${action.key}`} accessibilityRole="button" accessibilityLabel={action.label} disabled={busy} onPress={action.onPress} onFocus={()=>setFocused(action.key)} onBlur={()=>setFocused('')}
            style={({pressed})=>({alignItems:'center',justifyContent:'flex-end',minWidth:54,opacity:(busy||pressed)?0.65:1})}>
            <View style={{width:size,height:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',backgroundColor:action.color,borderWidth:2,borderColor:focused===action.key?Colors.focus:'white',boxShadow:'0 2px 5px rgba(70,40,12,0.16)'}}><AppIcon name={action.icon} color="onPrimary" size={Math.round(size*0.49)}/></View>
            <Text style={{textAlign:'center',fontWeight:'800',fontSize:compact?11:14,color:'#6D5949'}}>{action.label}</Text>
          </Pressable>;
        })}
      </View>
    </View>} />;
}
const styles=StyleSheet.create({
 stars:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16},
 badge:{alignSelf:'center',borderWidth:2,borderColor:'#FFE18A',backgroundColor:'#FFF5CF',borderRadius:40,paddingHorizontal:22,paddingVertical:7,color:'#A55300',fontFamily:FontFamily.rounded,fontSize:18,fontWeight:'800',textAlign:'center'},
 heading:{color:'#A45211',fontFamily:FontFamily.rounded,fontSize:42,lineHeight:50,fontWeight:'900',textAlign:'center'},
 description:{fontFamily:FontFamily.rounded,fontSize:21,lineHeight:29,textAlign:'center',color:Colors.textSecondary},
 metrics:{backgroundColor:'#FFF7EA',borderWidth:2,borderColor:'#F1E3CC',borderRadius:28,overflow:'hidden'},
 row:{flexDirection:'row',alignItems:'center',gap:16,padding:18},divider:{borderTopWidth:1,borderColor:'#FFE6AA'},
 metricIcon:{width:42,height:42,borderRadius:30,alignItems:'center',justifyContent:'center',flexShrink:0},
 label:{flex:1,minWidth:0,color:Colors.textPrimary,fontFamily:FontFamily.rounded,fontSize:21,fontWeight:'700'},
 value:{maxWidth:'44%',fontFamily:FontFamily.rounded,fontSize:23,lineHeight:29,fontWeight:'800',textAlign:'right',flexShrink:1},
 actions:{flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:8,flexShrink:0},action:{alignItems:'center',gap:6,flexShrink:1},
 circle:{borderRadius:100,borderWidth:4,borderColor:'#FFFFFF',alignItems:'center',justifyContent:'center',boxShadow:'0px 8px 16px rgba(0,0,0,0.10)'},
 actionLabel:{fontFamily:FontFamily.rounded,fontSize:16,fontWeight:'800',color:'#706454',textAlign:'center'},note:{fontSize:13,lineHeight:18,color:Colors.textSecondary,textAlign:'center'},error:{fontSize:14,color:'#A92D29',textAlign:'center'},
});
