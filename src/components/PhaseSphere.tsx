import { Image, View, StyleSheet } from 'react-native';

/** Decorative brand mark; not a visualization of hormones or mood. */
export function PhaseSphere({ small = false }: { small?: boolean }) {
 return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.wrap, small && styles.small]}><Image source={require('../../assets/sphere.png')} style={styles.image} resizeMode="contain" accessible={false}/></View>;
}
const styles=StyleSheet.create({wrap:{width:220,height:200,alignSelf:'center'},small:{width:150,height:140},image:{width:'100%',height:'100%'}});
