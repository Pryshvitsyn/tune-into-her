import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BRAND_TEXTURE_URI, PADDED_LOGO_WIDTH_SCALE, PADDED_LOGO_HEIGHT_SCALE } from './brandTexture.generated';

/** Match the first animation frame while real settings/content are loading. */
export function IntroLoading({dark}: {dark:boolean}) {
  const {width}=useWindowDimensions();
  const size=Math.min(width*.76,420);
  const edge=dark?'#10171E':'#DCE3E9',center=dark?'#26313D':'#F9FBFC';
  return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:edge}}
    accessible accessibilityLabel="Tune Into Her">
    <LinearGradient colors={[edge,center,edge]} locations={[0,.5,1]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={StyleSheet.absoluteFill}/>
    <Image source={{uri:BRAND_TEXTURE_URI}} resizeMode="contain" fadeDuration={0}
      style={{width:size*PADDED_LOGO_WIDTH_SCALE,height:size*PADDED_LOGO_HEIGHT_SCALE,tintColor:dark?'#E5EDF4':'#294458'}}/>
  </View>;
}
