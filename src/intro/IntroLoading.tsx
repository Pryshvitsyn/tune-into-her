import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { IntroAtmosphere } from './IntroAtmosphere';
import { FIRST_FRAME_LOGO_WIDTH_FRACTION, FIRST_FRAME_LOGO_WIDTH_CAP, FIRST_FRAME_LOGO_CENTER_X, FIRST_FRAME_LOGO_CENTER_Y, INTRO_BACKGROUND_COLOR } from './brandBackground.generated';
import { BRAND_TEXTURE_URI, PADDED_LOGO_WIDTH_SCALE, PADDED_LOGO_HEIGHT_SCALE } from './brandTexture.generated';

/** Match the native launch and first GPU frame, independent of saved app appearance. */
export function IntroLoading({dark}: {dark:boolean}) {
  const {width,height}=useWindowDimensions();
  const size=Math.min(width*FIRST_FRAME_LOGO_WIDTH_FRACTION,FIRST_FRAME_LOGO_WIDTH_CAP);
  return <View style={{flex:1,backgroundColor:INTRO_BACKGROUND_COLOR}} accessible accessibilityLabel="Tune Into Her">
    <IntroAtmosphere dark={dark}/>
    <Image source={{uri:BRAND_TEXTURE_URI}} resizeMode="contain" fadeDuration={0}
      style={[StyleSheet.absoluteFill,{left:width*FIRST_FRAME_LOGO_CENTER_X-size*PADDED_LOGO_WIDTH_SCALE/2,top:height*FIRST_FRAME_LOGO_CENTER_Y-size*PADDED_LOGO_HEIGHT_SCALE/2,width:size*PADDED_LOGO_WIDTH_SCALE,height:size*PADDED_LOGO_HEIGHT_SCALE}]}/>
  </View>;
}
