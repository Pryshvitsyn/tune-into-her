import { BRAND_RATIO } from './brand.generated';
import { BRAND_TEXTURE_URI } from './brandTexture.generated';
import { SCENE_AT_SOURCE } from './sceneRuntime.generated';
import { INTRO_MS } from './timeline';
import { V4_FRAGMENT, V4_VERTEX } from './v4Shaders.generated';

function replaceOnce(value: string, from: string, to: string): string {
  if (value.split(from).length !== 2) throw new Error(`V4 shader boundary changed: ${from}`);
  return value.replace(from, to);
}

/** Keep all V4 sampling, color and motion math. Only move its input coordinates. */
export function makeSceneFragment(): string {
  let core = replaceOnce(V4_FRAGMENT,
    'void main() {\n  vec2 p = v_uv * 2.0 - 1.0;',
    'vec4 shadeV4(vec2 p) {');
  core = replaceOnce(core, 'gl_FragColor = vec4(0.0);\n    return;', 'return vec4(0.0);');
  core = replaceOnce(core, 'gl_FragColor = vec4(col, alpha);', 'return vec4(col, alpha);');
  return core + `

uniform sampler2D u_logo;
uniform vec2 u_view;
uniform vec2 u_center;
uniform float u_radius;
uniform float u_shell;
uniform float u_depth;
uniform float u_logoWidth;
uniform float u_logoOpacity;
uniform vec3 u_ink;
uniform float u_camera;
uniform float u_layers;

// Six open ribbons at different depths, NOT six nested spheres.
// Every ribbon samples the existing local silver texture; nothing is downloaded.
vec3 depthSilver(vec2 pixel, vec3 underneath) {
  vec2 screen = (pixel - u_view * .5) / min(u_view.x, u_view.y);
  vec3 result = underneath;
  for (int layer = 0; layer < 6; layer++) {
    float i = float(layer);
    float z = u_camera + .62 - i * .68;
    if (z > .08 && z < 2.30) {
      float entry = smoothstep(.08, .40, z);
      float exit = 1.0 - smoothstep(1.35, 2.30, z);
      vec2 q = rot(.41 + i * 1.137) * screen * (.24 + z * .72);
      float bend = q.y + .24 * sin(q.x * 1.8 + i * 1.73 + u_phase * .22)
                         + .13 * sin(q.x * 3.1 - i * .67 - u_phase * .16);
      float strip = 1.0 - smoothstep(.12, .64, abs(bend - .18 * sin(i * 2.21)));
      // Keep samples inside the original texture, away from its circular edge.
      vec2 texUv = .5 + .30 * sin(vec2(q.x * .81 + i * 1.91 + u_phase * .17,
                                        q.y * .93 - i * 1.37 - u_phase * .14));
      vec3 metal = texture2D(u_tex, texUv).rgb;
      float excess = max(0.0, metal.g - max(metal.r, metal.b));
      metal += excess * vec3(.18, -.45, .24);
      float lum = dot(metal, vec3(.299, .587, .114));
      metal = mix(metal, vec3(lum), .38);
      metal = mix(metal, vec3(lum * .96, lum * .99, lum * 1.03), .22);
      float weight = .64 * u_layers * entry * exit * strip;
      result = mix(result, clamp(metal, 0.0, 1.0), weight);
    }
  }
  return result;
}

// A single padded, transparent PNG is used by native loading AND WebGL.
// Coordinates here remain in the original 640x400 design coordinate system.
// Padding is not a new background/oval; it contains only alpha=0 pixels.
float logoMask(vec2 uv) {
  vec2 padded = (uv * vec2(640.0, 400.0) + vec2(80.0)) / vec2(800.0, 560.0);
  if (padded.x < 0.0 || padded.x > 1.0 || padded.y < 0.0 || padded.y > 1.0) return 0.0;
  return texture2D(u_logo, padded).a;
}

void main() {
  vec2 pixel = vec2(v_uv.x, 1.0 - v_uv.y) * u_view;
  vec2 p = (v_uv * u_view - vec2(u_center.x, u_view.y - u_center.y)) / u_radius;
  vec4 sphere = shadeV4(p);
  // Exact V4 output after the intro: no extra compositing or material changes.
  if (u_logoOpacity <= 0. && u_shell >= 1. && u_layers <= 0.) {
    gl_FragColor = sphere;
    return;
  }
  // TIH_OVAL_FIX_V1: reveal the material uniformly; never cut a hole in its center.
  // The existing shrinking radius makes the sphere boundary enter from outside.
  // u_shell is already eased by sceneAt; do not normalize a radial mask by u_view.
  sphere.a *= clamp(u_shell, 0.0, 1.0);
  // TIH_DEEP_INTRO_V2: extra internal material only. Never punch an alpha hole.
  if (u_layers > 0. && sphere.a > 0.) sphere.rgb = depthSilver(pixel, sphere.rgb);

  vec2 uvLogo = (pixel - u_center) / vec2(u_logoWidth, u_logoWidth / ${BRAND_RATIO}) + .5;
  vec2 distortion = u_depth * .012 * vec2(
    sin(uvLogo.y * 7. + u_phase), cos(uvLogo.x * 6. - u_phase));
  uvLogo += distortion;
  float mark = logoMask(uvLogo);
  // All samples use padded bounds, never a tight rectangular cut around the mark.
  float spread = u_depth * .0018;
  float softMark = (logoMask(uvLogo + vec2(spread, 0.))
                   + logoMask(uvLogo - vec2(spread, 0.))
                   + logoMask(uvLogo + vec2(0., spread))
                   + logoMask(uvLogo - vec2(0., spread))) * .25;
  mark = mix(mark, softMark, u_depth * .7);
  float shine = dot(sphere.rgb, vec3(.299, .587, .114));
  float logoAlpha = mark * u_logoOpacity * (1. - u_depth * .82 * shine * sphere.a);
  float alpha = logoAlpha + sphere.a * (1. - logoAlpha);
  vec3 rgb = alpha > .00001
    ? (u_ink * logoAlpha + sphere.rgb * sphere.a * (1. - logoAlpha)) / alpha
    : vec3(0.);
  gl_FragColor = vec4(rgb, alpha);
}
`;
}

function json(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function makeSphereHtml(sourceBase64: string, testMode = false): string {
  if (!/^[a-zA-Z0-9+/=\r\n]+$/.test(sourceBase64)) throw new Error('Invalid local sphere texture');
  const config = {
    source: `data:image/png;base64,${sourceBase64}`,
    logo: BRAND_TEXTURE_URI,
    vertex: V4_VERTEX,
    fragment: makeSceneFragment(),
    duration: INTRO_MS,
    testMode,
  };
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}canvas{width:100%;height:100%;display:block;background:transparent}</style></head><body><canvas id="sphere"></canvas><script>
'use strict';
const C=${json(config)};
const sceneAt=${SCENE_AT_SOURCE};
${WEB_RUNTIME}
</script></body></html>`;
}

// Commands cross the RN/WebView boundary only for events, not for each frame.
const WEB_RUNTIME = String.raw`
(() => {
  const canvas = document.getElementById('sphere');
  let gl, program, frame = 0, last = 0, motionMs = 0, elapsed = 0;
  let loaded = false, started = false, active = true, reduced = false, failed = false, ended = false;
  let visible = !document.hidden;
  let target = null, ink = [.16,.27,.35], draws = 0;
  const textures = [], shaders = [];
  let buffer;
  const post = (type, extra = {}) => {
    const message = {type, elapsed, wallClock: Date.now(), running: active && visible && started && elapsed < C.duration, started, ...extra};
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
    if (C.testMode) window.dispatchEvent(new CustomEvent('tih-message', {detail: message}));
  };
  const stop = () => { if(frame) cancelAnimationFrame(frame); frame = 0; last = 0; };
  const fail = error => { if (failed) return; failed = true; stop(); post('error', {message: String(error)}); };
  const size = () => ({width: Math.max(1, innerWidth), height: Math.max(1, innerHeight)});
  const safeTarget = () => {
    const s = size();
    return target || {x:s.width/2, y:s.height/2, radius:Math.min(s.width*.38,s.height*.25)};
  };
  function resize() {
    const {width,height} = size();
    // Screen-size buffer, not an enormous off-screen scaled WebView.
    const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(1800000/(width*height)));
    const w = Math.max(1, Math.round(width*ratio)), h = Math.max(1, Math.round(height*ratio));
    if(canvas.width !== w || canvas.height !== h) {canvas.width=w; canvas.height=h;}
    gl.viewport(0,0,w,h);
  }
  const uniforms = {};
  function draw() {
    if (!loaded || failed) return;
    const view = size();
    const scene = sceneAt(elapsed, view, safeTarget());
    resize();
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (elapsed >= C.duration) {
      const sx = canvas.width/view.width, sy = canvas.height/view.height;
      // Today may scroll its reserved sphere slot completely outside the viewport.
      // Intersect both edges: an offscreen origin must never yield a negative extent.
      const left = Math.max(0,Math.min(canvas.width,Math.floor((scene.x-scene.radius-2)*sx)));
      const right = Math.max(left,Math.min(canvas.width,Math.ceil((scene.x+scene.radius+2)*sx)));
      const bottom = Math.max(0,Math.min(canvas.height,Math.floor((view.height-scene.y-scene.radius-2)*sy)));
      const top = Math.max(bottom,Math.min(canvas.height,Math.ceil((view.height-scene.y+scene.radius+2)*sy)));
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(left,bottom,right-left,top-bottom);
    }
    gl.uniform2f(uniforms.u_view, view.width,view.height);
    gl.uniform2f(uniforms.u_center, scene.x,scene.y);
    gl.uniform1f(uniforms.u_radius, Math.max(1,scene.radius));
    gl.uniform1f(uniforms.u_shell, scene.shell);
    gl.uniform1f(uniforms.u_depth, scene.depth);
    gl.uniform1f(uniforms.u_camera, scene.camera);
    gl.uniform1f(uniforms.u_layers, scene.layers);
    gl.uniform1f(uniforms.u_logoWidth, Math.max(1,scene.logoWidth));
    gl.uniform1f(uniforms.u_logoOpacity, scene.logoOpacity);
    gl.uniform3f(uniforms.u_ink, ink[0],ink[1],ink[2]);
    gl.uniform1f(uniforms.u_phase, reduced ? 0 : ((motionMs % 8000)/8000)*Math.PI*2);
    gl.drawArrays(gl.TRIANGLES,0,6);
    draws++;
  }
  function tick(now) {
    frame = 0;
    if (!active || !visible || failed || !loaded || !started) return;
    const dt = last ? Math.max(0,now-last) : 0;
    last = now;
    motionMs += dt;
    elapsed = Math.min(C.duration,elapsed+dt);
    draw();
    if (elapsed >= C.duration && !ended) { ended = true; post('complete'); }
    if (!reduced) frame = requestAnimationFrame(tick);
  }
  function schedule() {
    if (!active || !visible || failed || !loaded || !started) return;
    if (reduced) {draw(); return;}
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function finish() {
    elapsed = C.duration;
    draw();
    if (loaded) gl.finish();
    post('clock');
    if (!ended) {ended=true; post('complete');}
    schedule();
  }
  window.__TIH_CONTROL__ = command => {
    if (!command || failed) return;
    try {
      if (command.type === 'configure') {
        const t = command.target;
        if(t && [t.x,t.y,t.radius].every(Number.isFinite) && t.radius>0) target = t;
        if(Array.isArray(command.ink) && command.ink.length===3 && command.ink.every(Number.isFinite))
          ink=command.ink.map(x=>Math.max(0,Math.min(1,x)));
        draw();
      } else if (command.type === 'start' && !started && loaded) {
        reduced = !!command.reducedMotion;
        started = true;
        elapsed = (!command.animate || reduced) ? C.duration : 0;
        motionMs = 0; ended = false; last = 0;
        draw(); gl.finish(); post('clock');
        if(elapsed>=C.duration) {ended=true; post('complete');}
        schedule();
      } else if (command.type === 'active') {
        active=!!command.value; stop(); post('clock'); schedule();
      } else if (command.type === 'reduce-motion') {
        reduced=!!command.value; stop();
        if(reduced) finish(); else schedule();
      } else if (command.type === 'finish') {
        finish();
      } else if (command.type === 'dispose') {
        failed=true; stop();
      }
    } catch(error) {fail(error);}
  };
  if(C.testMode) window.__TIH_TEST__ = {
    seek(ms) {stop(); elapsed=Math.max(0,Math.min(C.duration,ms)); motionMs=ms; draw();},
    state() {return {loaded,started,active,reduced,failed,elapsed,draws,scene:sceneAt(elapsed,size(),safeTarget())};},
  };
  document.addEventListener('visibilitychange',()=>{
    // Visibility and RN focus are independent. Returning to a visible WebView must
    // resume only if RN still requested activity, without counting hidden time.
    visible=!document.hidden; stop(); post('clock'); schedule();
  });
  window.addEventListener('resize',()=>{draw();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail('WebGL context lost');});
  window.addEventListener('beforeunload',()=>{
    stop();
    if(gl) {textures.forEach(t=>gl.deleteTexture(t)); shaders.forEach(s=>gl.deleteShader(s));
      if(buffer) gl.deleteBuffer(buffer); if(program) gl.deleteProgram(program);}
  });
  async function boot() {
    try {
      gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
      if(!gl) throw new Error('WebGL unavailable');
      const compile=(type,source)=>{
        const shader=gl.createShader(type); if(!shader) throw new Error('Shader allocation failed');
        shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)||'Shader compilation failed');
        return shader;
      };
      program=gl.createProgram(); if(!program) throw new Error('Program allocation failed');
      gl.attachShader(program,compile(gl.VERTEX_SHADER,C.vertex));
      gl.attachShader(program,compile(gl.FRAGMENT_SHADER,C.fragment));
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)||'Shader link failed');
      gl.useProgram(program);
      buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'a_position');
      gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      ['u_tex','u_logo','u_phase','u_view','u_center','u_radius','u_shell','u_depth','u_logoWidth','u_logoOpacity','u_ink','u_camera','u_layers']
        .forEach(name=>{uniforms[name]=gl.getUniformLocation(program,name);});
      const load=(src,unit)=>new Promise((resolve,reject)=>{
        const image=new Image();
        image.onerror=()=>reject(new Error('Local texture failed to decode'));
        image.onload=()=>{
          try {
            const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
            if(image.width>max || image.height>max) throw new Error('Texture exceeds device GPU limit');
            const texture=gl.createTexture(); if(!texture) throw new Error('Texture allocation failed');
            textures.push(texture); gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,texture);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
            const uploadError=gl.getError();
            if(uploadError!==gl.NO_ERROR) throw new Error('GPU texture upload failed: '+uploadError);
            resolve(true);
          } catch(error) {reject(error);}
        };
        image.src=src;
      });
      await Promise.all([load(C.source,0),load(C.logo,1)]);
      gl.uniform1i(uniforms.u_tex,0); gl.uniform1i(uniforms.u_logo,1);
      loaded=true; draw(); gl.finish(); post('ready');
    } catch(error) {fail(error);}
  }
  boot();
})();
`;
