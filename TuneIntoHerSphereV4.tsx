import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

const LOOP_SECONDS = 8;

type SphereResources = { sourceBase64: string; html: string };

let preparedSphereResources: Promise<SphereResources> | null = null;

export function prepareSphereResources(): Promise<SphereResources> {
  preparedSphereResources ??= (async () => {
    const texture = Asset.fromModule(require('./assets/tune_into_her_sphere_source_clean.png'));
    const poster = Asset.fromModule(require('./assets/tune_into_her_sphere_phase0_poster.png'));
    await Promise.all([texture.downloadAsync(), poster.downloadAsync()]);
    await Image.prefetch(poster.localUri ?? poster.uri);
    const sourceBase64 = await FileSystem.readAsStringAsync(texture.localUri ?? texture.uri, { encoding: 'base64' });
    return { sourceBase64, html: makeHtml(sourceBase64) };
  })();
  return preparedSphereResources;
}

export function prepareSphereAsset(): Promise<string> {
  return prepareSphereResources().then(({ sourceBase64 }) => sourceBase64);
}

const vertexShader = "attribute vec2 a_position;\nvarying vec2 v_uv;\nvoid main() {\n  v_uv = a_position * 0.5 + 0.5;\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}";
const fragmentShader = "precision highp float;\n\nuniform sampler2D u_tex;\nuniform float u_phase;\nvarying vec2 v_uv;\n\nfloat sat(float x) { return clamp(x, 0.0, 1.0); }\n\nmat2 rot(float a) {\n  float s = sin(a), c = cos(a);\n  return mat2(c, -s, s, c);\n}\n\nvoid main() {\n  vec2 p = v_uv * 2.0 - 1.0;\n  float rr = length(p);\n\n  if (rr > 1.0) {\n    gl_FragColor = vec4(0.0);\n    return;\n  }\n\n  // Stable shell, movement inside.\n  float inner = smoothstep(0.985, 0.52, rr);\n  float w = pow(inner, 2.0);\n\n  float phase = u_phase;\n  float s = sin(phase);\n  float c = cos(phase);\n\n  vec2 q = p;\n  vec2 p1 = rot(0.18 * s) * p;\n  vec2 p2 = rot(-0.14 * c) * p;\n\n  vec2 flow1 = vec2(\n    sin(2.4 * p1.y + 2.0 * p1.x + 1.2 * s),\n    cos(2.9 * p1.x - 1.7 * p1.y + 1.1 * c)\n  );\n\n  vec2 flow2 = vec2(\n    cos(2.1 * p2.y - 3.0 * p2.x - 0.9 * s),\n    sin(2.6 * p2.x + 2.1 * p2.y + 1.0 * c)\n  );\n\n  vec2 tangent = vec2(-p.y, p.x);\n  float swirl = 0.016 * sin(3.0 * rr + 2.5 * atan(p.y, p.x) + phase)\n              + 0.008 * cos(4.4 * rr - 1.8 * atan(p.y, p.x) - phase);\n\n  q += w * (0.011 * flow1 + 0.008 * flow2);\n  q += w * tangent * swirl;\n\n  q *= 1.0 + w * (0.006 * sin(6.0 * q.x - 4.0 * q.y + phase)\n                + 0.005 * cos(5.0 * q.y + 3.0 * q.x - phase));\n\n  vec2 uvA = q * 0.5 + 0.5;\n\n  // Keep the second sample subtle so the metal stays crisp.\n  vec2 qB = rot(0.10 * s - 0.07 * c) * q;\n  vec2 uvB = qB * 0.5 + 0.5;\n\n  vec4 texA = texture2D(u_tex, uvA);\n  vec4 texB = texture2D(u_tex, uvB);\n\n  float mixAmt = 0.045 + 0.025 * sin(phase + rr * 2.4);\n  vec4 base = mix(texA, texB, mixAmt);\n\n  vec2 refr = w * 0.0012 * vec2(\n    sin(4.2 * q.y + phase),\n    cos(4.0 * q.x - phase)\n  );\n\n  float rch = texture2D(u_tex, uvA + refr).r;\n  float gch = base.g;\n  float bch = texture2D(u_tex, uvA - refr).b;\n  vec3 col = vec3(rch, gch, bch);\n\n  // Favor a neutral silver/chrome body with only a restrained cool cast.\n  float greenExcess = max(0.0, col.g - max(col.r, col.b));\n  col.g -= greenExcess * 0.45;\n  col.r += greenExcess * 0.18;\n  col.b += greenExcess * 0.24;\n\n  float lum = dot(col, vec3(0.299, 0.587, 0.114));\n  col = mix(col, vec3(lum), 0.38);\n  col = mix(col, vec3(lum * 0.96, lum * 0.99, lum * 1.03), 0.22);\n\n  // Slow, low-amplitude shimmer keeps the metal alive without electric blue.\n  float coolShimmer = w * (\n      0.008 * sin(5.0 * q.x + 2.8 * q.y + phase)\n    + 0.005 * cos(4.2 * q.y - 2.4 * q.x - phase)\n  );\n  col += vec3(0.10, 0.16, 0.22) * coolShimmer;\n\n  // Mild unsharp-style local contrast to reduce the \"blurred layer\" feeling.\n  vec2 px = vec2(1.0 / 768.0, 0.0);\n  vec2 py = vec2(0.0, 1.0 / 768.0);\n  vec3 avg = (\n      texture2D(u_tex, uvA + px).rgb\n    + texture2D(u_tex, uvA - px).rgb\n    + texture2D(u_tex, uvA + py).rgb\n    + texture2D(u_tex, uvA - py).rgb\n  ) * 0.25;\n\n  vec3 detail = texA.rgb - avg;\n  col += detail * (0.14 * w);\n\n  // Slightly stronger micro-contrast, without crushing highlights.\n  col = (col - 0.5) * 1.025 + 0.5;\n\n  float fres = pow(sat((rr - 0.72) / 0.28), 3.0);\n  col += vec3(0.06, 0.08, 0.11) * fres * 0.07;\n\n  col = clamp(col, 0.0, 1.0);\n\n  float alpha = base.a * (1.0 - smoothstep(0.988, 1.0, rr));\n  gl_FragColor = vec4(col, alpha);\n}";

function makeHtml(sourceBase64: string) {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}
canvas{width:100%;height:100%;display:block}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const SOURCE='data:image/png;base64,${sourceBase64}';
const LOOP_SECONDS=${LOOP_SECONDS};
const vsSource=${JSON.stringify(vertexShader)};
const fsSource=${JSON.stringify(fragmentShader)};

const canvas=document.getElementById('c');
const post=(type)=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type,wallClock:Date.now()}));
post('T3_HTML_LOADED');
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
if(!gl){post('sphere-error');throw new Error('WebGL unavailable');}
post('T4_WEBGL_CONTEXT_READY');

function shader(type,src){
  const s=gl.createShader(type);
  gl.shaderSource(s,src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

const program=gl.createProgram();
gl.attachShader(program,shader(gl.VERTEX_SHADER,vsSource));
gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fsSource));
gl.linkProgram(program);
gl.useProgram(program);
post('T6_SHADER_COMPILED');

const pos=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,pos);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);

const aPos=gl.getAttribLocation(program,'a_position');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);

const uTex=gl.getUniformLocation(program,'u_tex');
const uPhase=gl.getUniformLocation(program,'u_phase');

const tex=gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D,tex);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.uniform1i(uTex,0);

function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(innerWidth*dpr));
  const h=Math.max(1,Math.round(innerHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){
    canvas.width=w;
    canvas.height=h;
    gl.viewport(0,0,w,h);
  }
}

let textureReady=false;

function drawPhase(phase){
  if(!textureReady) return false;

  resize();
  gl.clearColor(0,0,0,0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(uPhase,phase);
  gl.drawArrays(gl.TRIANGLES,0,6);
  gl.flush();

  return true;
}

window.__setSpherePhase=drawPhase;

const img=new Image();
img.onload=()=>{
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  post('T5_TEXTURE_UPLOADED');

  textureReady=true;
  drawPhase(0);
  gl.finish();
  post('T7_FIRST_FRAME_RENDERED');
  post('FIRST_FRAME_READY');
};

img.onerror=()=>{
  post('sphere-error');
};

img.src=SOURCE;
</script>
</body>
</html>`;
}

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function TuneIntoHerSphereV4({ size = 340, style }: Props) {
  const [mountedAt] = useState(() => Date.now());
  const timings = useRef<Record<string, number>>({ T0_COMPONENT_MOUNT: mountedAt });
  const [resources, setResources] = useState<SphereResources | null>(null);
  const [webReady, setWebReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const mark = (name: string, at: number) => {
    timings.current[name] = at;
    return at;
  };

  useEffect(() => {
    let alive = true;
    void prepareSphereResources()
      .then((value) => {
        if (!alive) return;
        mark('T2_WEBVIEW_CREATED', Date.now());
        setResources(value);
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!webReady) return;

    const startedAt = Date.now();

    const pushPhase = () => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const t = elapsedSeconds % LOOP_SECONDS;
      const phase = (t / LOOP_SECONDS) * Math.PI * 2;

      webViewRef.current?.injectJavaScript(
        `window.__setSpherePhase(${phase}); true;`
      );
    };

    pushPhase();
    const timer = setInterval(pushPhase, 33);

    return () => clearInterval(timer);
  }, [webReady]);

  return (
    <View
      pointerEvents="none"
      style={[
        {
          width: size,
          height: size,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      <Image
        source={require('./assets/tune_into_her_sphere_phase0_poster.png')}
        defaultSource={require('./assets/tune_into_her_sphere_phase0_poster.png')}
        resizeMode="contain"
        onLayout={() => mark('T1_POSTER_VISIBLE', Date.now())}
        style={{ position: 'absolute', width: size, height: size, opacity: webReady ? 0 : 1 }}
      />
      {resources ? (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: resources.html }}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data) as { type?: string; wallClock?: number };
              if (!message.type) return;
              mark(message.type, message.wallClock ?? Date.now());
              if (message.type === 'FIRST_FRAME_READY') {
                mark('T8_FIRST_FRAME_READY_RECEIVED', Date.now());
                setWebReady(true);
                if (__DEV__) {
                  const base = timings.current.T0_COMPONENT_MOUNT ?? mountedAt;
                  const report = Object.fromEntries(Object.entries(timings.current).map(([key, value]) => [key, value - base]));
                  console.info('[TuneIntoHerSphereV4 startup ms]', report);
                }
              } else if (message.type === 'sphere-error') {
                // Keep the exact bundled phase-zero poster visible on a real WebGL failure.
              }
            } catch {}
          }}
          onError={() => undefined}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          containerStyle={{ backgroundColor: 'transparent' }}
          androidLayerType="hardware"
        />
      ) : null}
    </View>
  );
}

void prepareSphereResources();
