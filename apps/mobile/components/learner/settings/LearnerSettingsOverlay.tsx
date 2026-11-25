import React, { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { usePathname } from 'expo-router';
import { SettingsScreen } from './SettingsScreen';

const listeners = new Set<() => void>();
export function openLearnerSettings() { listeners.forEach(open => open()); }

export function LearnerSettingsOverlay() {
 const [open, setOpen] = useState<string | null>(null);
 const pathname = usePathname();
 useEffect(() => { const show = () => setOpen(pathname); listeners.add(show); return () => { listeners.delete(show); }; }, [pathname]);

 if (open !== null && open !== pathname) setOpen(null);
 if (open !== pathname) return null;
 return <Modal transparent visible animationType="fade" onRequestClose={() => setOpen(null)}>
  <View style={{flex:1,backgroundColor:'rgba(36,31,27,.35)',padding:12,justifyContent:'center',alignItems:'center'}} testID="learner-settings-overlay">
   <Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={()=>setOpen(null)} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}/>
   <View accessibilityViewIsModal style={{width:'100%',maxWidth:1100,height:'100%',maxHeight:760,borderRadius:24,overflow:'hidden'}}>
    <SettingsScreen onClose={()=>setOpen(null)}/>
   </View>
  </View>
 </Modal>;
}
