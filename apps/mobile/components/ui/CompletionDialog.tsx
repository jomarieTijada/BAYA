import React, { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { Colors, FontFamily } from '../../constants/theme';
import { BayaDialog } from './BayaDialog';
import { AppIcon, type AppIconName } from './AppIcon';

export type CompletionMetric = { label: string; value: string; icon: AppIconName; tone: 'green' | 'blue' | 'orange' };
type Action = { label: string; onPress: () => void };
export type CompletionDialogProps = {
  badge: string; title: string; description: string; metrics: readonly CompletionMetric[];
  note?: string; error?: string; busy?: boolean;
  summary: Action; next: Action; retry: Action;
  review?: ReactNode; reviewTitle?: string;
};
const palette = {green:'#18C45A',blue:'#08A6E4',orange:'#DE8000',pink:'#FC6784'};
function CelebrationStar({size}: {size:number}) {
  return <Svg width={size} height={size} viewBox="0 0 100 100"><Polygon points="50,2 64,33 98,38 73,62 79,96 50,80 21,96 27,62 2,38 36,33" fill="#FFC21C" /></Svg>;
}

/** One screenshot-based completion presentation over the existing BAYA modal infrastructure. */
export function CompletionDialog({badge,title,description,metrics,note,error,busy=false,summary,next,retry,review,reviewTitle}: CompletionDialogProps) {
  const {width,height}=useWindowDimensions();
  const [focused,setFocused]=useState('');
  const compact=width<600 || height<600;
  const circle=compact?58:84, primary=compact?72:108;
  return <BayaDialog visible title={review ? reviewTitle ?? title : title} variant="success" primaryAction={{label:next.label,onPress:next.onPress,loading:busy}}
    onDismiss={summary.onPress} completionContent={<View style={{maxHeight:height-32,minHeight:0,padding:compact?12:28,gap:compact?8:16}}>
      <ScrollView style={{flexShrink:1,minHeight:0}} contentContainerStyle={{gap:compact?10:18}} testID="completion-content">
        {!review && <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" style={styles.stars} testID="completion-decorative-stars">
          <CelebrationStar size={compact?32:48}/><CelebrationStar size={compact?50:76}/><CelebrationStar size={compact?32:48}/>
        </View>}
        <Text style={[styles.badge,compact&&{fontSize:13,paddingVertical:4}]}>{badge}</Text>
        <Text accessibilityRole="header" style={[styles.heading,compact&&{fontSize:28,lineHeight:34}]}>{review ? reviewTitle : title}</Text>
        <Text nativeID="completion-description" style={[styles.description,compact&&{fontSize:16,lineHeight:21}]}>{description}</Text>
        {review ?? <View style={styles.metrics} testID="completion-metrics">
          {metrics.map((metric,index)=><View key={metric.label} style={[styles.row,compact&&{padding:10,gap:8},index>0&&styles.divider]}>
            <View style={[styles.metricIcon,{backgroundColor:metric.tone==='green'?'#DCF3DE':metric.tone==='blue'?'#E2EFF7':'#FFECCC'},compact&&{width:32,height:32}]}><AppIcon name={metric.icon} color={metric.tone==='green'?'success':metric.tone==='blue'?'adventure':'accent'} size={compact?20:26}/></View>
            <Text style={[styles.label,compact&&{fontSize:16,lineHeight:21}]}>{metric.label}</Text>
            <Text style={[styles.value,{color:metric.tone==='green'?'#12803C':metric.tone==='blue'?'#0076A3':'#9C5900'},compact&&{fontSize:17,lineHeight:23}]}>{metric.value}</Text>
          </View>)}
        </View>}
        {!!note&&<Text style={styles.note}>{note}</Text>}
        {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </ScrollView>
      <View style={styles.actions} testID="completion-actions">
        {[{...summary,key:'summary',color:palette.pink,icon:'menu' as const},{...next,key:'next',color:palette.green,icon:'arrowRight' as const},{...retry,key:'retry',color:palette.blue,icon:'sync' as const}].map((action,index)=><View key={action.key} style={styles.action}>
          <Pressable testID={`completion-${action.key}`} accessibilityRole="button" accessibilityLabel={action.label} accessibilityState={{disabled:busy}} disabled={busy} onPress={action.onPress} onFocus={()=>setFocused(action.key)} onBlur={()=>setFocused('')}
            style={({pressed})=>[styles.circle,{backgroundColor:action.color,width:index===1?primary:circle,height:index===1?primary:circle,opacity:busy?.5:pressed?.8:1},focused===action.key&&{borderColor:Colors.focus,borderWidth:4}]}>
            <AppIcon name={action.icon} color="onPrimary" size={index===1?(compact?32:44):(compact?27:34)}/>
          </Pressable>
          <Text style={[styles.actionLabel,index===1&&{color:'#12803C'},compact&&{fontSize:13}]}>{action.label}</Text>
        </View>)}
      </View>
    </View>} />;
}
const styles=StyleSheet.create({
 stars:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16},
 badge:{alignSelf:'center',borderWidth:2,borderColor:'#FFE18A',backgroundColor:'#FFF5CF',borderRadius:40,paddingHorizontal:22,paddingVertical:7,color:'#A55300',fontFamily:FontFamily.rounded,fontSize:18,fontWeight:'800',textAlign:'center'},
 heading:{color:'#18BE55',fontFamily:FontFamily.rounded,fontSize:42,lineHeight:50,fontWeight:'900',textAlign:'center'},
 description:{fontFamily:FontFamily.rounded,fontSize:21,lineHeight:29,textAlign:'center',color:Colors.textSecondary},
 metrics:{backgroundColor:'#FFF7EA',borderWidth:2,borderColor:'#F1E3CC',borderRadius:28,overflow:'hidden'},
 row:{flexDirection:'row',alignItems:'center',gap:16,padding:18},divider:{borderTopWidth:1,borderColor:'#FFE6AA'},
 metricIcon:{width:42,height:42,borderRadius:30,alignItems:'center',justifyContent:'center',flexShrink:0},
 label:{flex:1,minWidth:0,color:Colors.textPrimary,fontFamily:FontFamily.rounded,fontSize:21,fontWeight:'700'},
 value:{maxWidth:'44%',fontFamily:FontFamily.rounded,fontSize:23,lineHeight:29,fontWeight:'800',textAlign:'right',flexShrink:1},
 actions:{flexDirection:'row',alignItems:'flex-end',justifyContent:'center',gap:22,flexShrink:0},action:{alignItems:'center',gap:6,flexShrink:1},
 circle:{borderRadius:100,borderWidth:4,borderColor:'#FFFFFF',alignItems:'center',justifyContent:'center',boxShadow:'0px 8px 16px rgba(0,0,0,0.10)'},
 actionLabel:{fontFamily:FontFamily.rounded,fontSize:16,fontWeight:'800',color:'#706454',textAlign:'center'},note:{fontSize:13,lineHeight:18,color:Colors.textSecondary,textAlign:'center'},error:{fontSize:14,color:'#A92D29',textAlign:'center'},
});
