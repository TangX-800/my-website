"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const cards = [
  ["profile", "个人头像", 1024, 1536, "/cards/work-1.webp", false],
  ["illustration", "美宣插画", 1024, 1536, "/cards/work-2.webp", false],
  ["eggy", "蛋仔派对", 1672, 941, "/cards/work-3.webp", false],
  ["unreleased", "未公开项目", 1086, 1448, "/cards/work-4.webp", false],
  ["aniimo", "伊莫", 1672, 941, "/cards/work-5.webp", false],
  ["energy-management", "家庭能源管理系统", 941, 1672, "/cards/work-6.webp", false],
  ["sungrow", "阳光家庭能源", 1536, 1024, "/cards/work-7.webp", false],
  ["iflytek", "讯飞绘文", 1447, 1087, "/cards/work-8.webp?v=5d0fb4c7", false],
] as const;

const wrap = (value: number, length: number) =>
  THREE.MathUtils.euclideanModulo(value + length / 2, length) - length / 2;

const VERTEX = /* glsl */ `
uniform float uW, uD, uT, uV, uLean, uHover, uDent, uSpecial, uRipple, uWaveTime;
uniform vec2 uRes,uPointer;
varying vec2 vUv;
varying vec3 vFlat;
const float PI=3.141592653589793;
float q(float x){return x/max(uW,.0001)*uT-.2;}
float shape(float x){return sin(PI*x)*exp(-x*x);}
float slope(float x){return (PI*cos(PI*x)-2.*x*sin(PI*x))*exp(-x*x);}
float dome(vec2 uv){vec2 p=uv*2.-1.;return (1.-p.x*p.x)*(1.-p.y*p.y);}
float ramp(float x){x=clamp(x,-1.,1.);return x*(1.5-.5*x*x);}
void main(){
  vUv=uv;
  vec3 p=position;
  if(uSpecial>.5){
    vec2 delta=(uv-uPointer)*vec2(uRes.x/max(uRes.y,.0001),1.);
    float dist=length(delta);
    float pulseT=smoothstep(0.,.52,uRipple);
    float pulseRadius=mix(.02,1.12,pulseT);
    float pulse=sin((dist-pulseRadius)*20.)*exp(-abs(dist-pulseRadius)*7.);
    float pulseLife=smoothstep(0.,.08,uRipple)*(1.-smoothstep(.5,.7,uRipple));
    float inside=1.-smoothstep(pulseRadius-.02,pulseRadius+.02,dist);
    float trailing=sin((pulseRadius-dist)*17.)*exp(-max(0.,pulseRadius-dist)*1.8)*inside;
    float revealT=smoothstep(.48,1.,uRipple);
    revealT=revealT*revealT*(3.-2.*revealT);
    float peelRadius=mix(1.45,-.12,revealT);
    float peel=exp(-pow((dist-peelRadius)*8.,2.));
    p.z+=(pulse*.12*pulseLife+trailing*.105*pulseLife+peel*.2*revealT*(1.-revealT))*uRes.y;
  }else{
    vec2 delta=(uv-uPointer)*vec2(uRes.x/max(uRes.y,.0001),1.);
    float dist=length(delta);
    float wave=sin(dist*23.-uWaveTime*8.)*exp(-dist*1.55)*uRipple;
    float echo=sin(dist*36.-uWaveTime*10.)*exp(-dist*3.)*uRipple;
    p.z+=(wave*.075+echo*.028-uHover*uDent*dome(uv)*.3)*uRes.y;
  }
  vec4 w=modelMatrix*vec4(p,1.);
  vFlat=w.xyz;
  float roll=-.16*slope(q(w.x))/PI;
  roll+=1.45*uV*smoothstep(.3,.9,abs(w.x/uW))*sign(w.x);
  float s=sin(roll),c=cos(roll);
  w.yz=vec2(w.y*c-w.z*s,w.y*s+w.z*c);
  w.z+=-uD*shape(q(w.x));
  w.y+=.03*w.x;
  float side=1.-smoothstep(-1.,.3,w.x/uW);
  w.y+=.1*uW*uV*side;
  w.z+=.2*uW*uV*side;
  w.z+=uLean*ramp(w.x/uW);
  gl_Position=projectionMatrix*viewMatrix*w;
}`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uTexture,uRevealTexture;
uniform vec2 uMedia,uRes;
uniform vec2 uPointer;
uniform float uAlpha,uCorner,uW,uD,uT,uV,uHover,uDent,uLabel,uSpecial,uRipple,uWaveTime;
varying vec2 vUv;
varying vec3 vFlat;
const float PI=3.141592653589793;
vec2 cover(vec2 p,vec2 i,vec2 uv){
  float pr=p.x/p.y,ir=i.x/i.y;
  vec2 n=pr<ir?vec2(i.x*(p.y/i.y),p.y):vec2(p.x,i.y*(p.x/i.x));
  vec2 o=(pr<ir?vec2((n.x-p.x)*.5,0.):vec2(0.,(n.y-p.y)*.5))/n;
  return uv*p/n+o;
}
float box(vec2 p,vec2 m,float r){vec2 q=abs(p-m)-(m-r);return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float dome(vec2 uv){vec2 p=uv*2.-1.;return (1.-p.x*p.x)*(1.-p.y*p.y);}
float zAt(float x){float q=x/max(uW,.0001)*uT-.2;return -uD*sin(PI*q)*exp(-q*q);}
void main(){
  vec2 uv=uLabel>.5?vUv:cover(uRes,uMedia,vUv);
  vec4 tex=texture2D(uTexture,uv);
  if(uSpecial>.5&&uLabel<.5){
    vec2 ratio=vec2(uRes.x/max(uRes.y,.0001),1.);
    vec2 delta=(vUv-uPointer)*ratio;
    float dist=length(delta);
    float revealT=smoothstep(.48,1.,uRipple);
    revealT=revealT*revealT*(3.-2.*revealT);
    float radius=mix(1.45,-.12,revealT);
    float angle=atan(delta.y,delta.x);
    float wobble=(sin(angle*3.+uRipple*8.)*.045+sin(angle*7.-uRipple*5.)*.02)*(1.-revealT*.65);
    float edge=radius+wobble;
    float peelBand=exp(-pow((dist-edge)*12.,2.));
    float pulseT=smoothstep(0.,.52,uRipple);
    float pulseRadius=mix(.02,1.12,pulseT);
    float pulseLife=smoothstep(0.,.08,uRipple)*(1.-smoothstep(.5,.7,uRipple));
    float pulseBand=exp(-pow((dist-pulseRadius)*10.,2.))*pulseLife;
    float inside=1.-smoothstep(pulseRadius-.02,pulseRadius+.02,dist);
    float trailing=sin((pulseRadius-dist)*17.)*exp(-max(0.,pulseRadius-dist)*1.8)*inside*pulseLife;
    float band=max(peelBand*revealT*(1.-revealT),pulseBand);
    vec2 dir=delta/max(dist,.001)/ratio;
    float refraction=sin((dist-edge)*42.)*band*.035+trailing*.014;
    vec2 warped=clamp(uv+dir*refraction,vec2(.002),vec2(.998));
    vec4 pink=texture2D(uTexture,warped);
    vec4 reveal=texture2D(uRevealTexture,clamp(uv-dir*refraction*.45,vec2(.002),vec2(.998)));
    float pinkMask=1.-smoothstep(edge-.055,edge+.045,dist);
    tex=mix(reveal,pink,pinkMask);
  }else if(uLabel<.5&&uRipple>.001){
    vec2 ratio=vec2(uRes.x/max(uRes.y,.0001),1.);
    vec2 delta=(vUv-uPointer)*ratio;
    float dist=length(delta);
    vec2 dir=delta/max(dist,.001)/ratio;
    float wave=sin(dist*23.-uWaveTime*8.)*exp(-dist*1.55)*uRipple;
    float echo=sin(dist*36.-uWaveTime*10.)*exp(-dist*3.)*uRipple;
    vec2 warped=clamp(uv+dir*(wave*.024+echo*.009),vec2(.002),vec2(.998));
    tex=texture2D(uTexture,warped);
  }
  if(uSpecial>.5&&uLabel<.5){
    float settle=smoothstep(.94,1.,uRipple);
    tex=mix(tex,texture2D(uRevealTexture,uv),settle);
  }
  vec2 sz=vec2(uRes.x/max(uRes.y,.0001),1.),mid=sz*.5;
  float r=min(uCorner,min(mid.x,mid.y));
  float edge=box(vUv*sz,mid,r);
  float mask=1.-smoothstep(-max(fwidth(edge),.0001),max(fwidth(edge),.0001),edge);
  float ca=abs(uV)*.007;
  if(ca>.001&&uSpecial<.5){
    vec2 buv=uLabel>.5?vUv:cover(uRes,uMedia,vUv);
    tex.r=texture2D(uTexture,clamp(buv+vec2(ca,0.),vec2(.002),vec2(.998))).r;
    tex.b=texture2D(uTexture,clamp(buv-vec2(ca,0.),vec2(.002),vec2(.998))).b;
  }
  vec2 hd=(vUv-uPointer)*vec2(uRes.x/max(uRes.y,.0001),1.);
  tex.rgb+=exp(-length(hd)*5.5)*.16*uHover;
  gl_FragColor=vec4(tex.rgb,tex.a*uAlpha*mask);
  #include <colorspace_fragment>
}`;

const FLOOR_VERT = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FLOOR_FRAG = `
varying vec2 vUv;uniform float uAlpha;
void main(){
  vec2 g=vec2(vUv.x*72.,vUv.y*42.);
  vec2 d=abs(fract(g)-.5),w=fwidth(g)*1.4;
  float line=max(1.-smoothstep(0.,w.x,d.x),1.-smoothstep(0.,w.y,d.y));
  float fade=(1.-smoothstep(.05,.96,vUv.y))*smoothstep(0.,.08,vUv.y);
  gl_FragColor=vec4(vec3(.012+line*.07),uAlpha*fade);
}`;

type Item = {
  index: number;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  label: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  texture: THREE.Texture;
  video?: HTMLVideoElement;
  revealTexture?: THREE.Texture;
  left: number;
  width: number;
  hover: number;
  ripple: number;
  waveTime: number;
  pointer: THREE.Vector2;
  screen: {left: number; right: number; top: number; bottom: number};
};

function labelTexture(aspect: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = Math.round(canvas.width / aspect);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const s = canvas.height / 1172;
    const px = 62 * s;
    const pb = 31 * s;
    const button = 80 * s;
    const bx = canvas.width - px - button / 2;
    const by = canvas.height - pb - button / 2;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(bx, by, button / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = Math.max(3, 5 * s);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const a = button * .19;
    ctx.beginPath();
    ctx.moveTo(bx - a, by); ctx.lineTo(bx + a, by);
    ctx.moveTo(bx + a * .2, by - a * .75); ctx.lineTo(bx + a, by); ctx.lineTo(bx + a * .2, by + a * .75);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detailRef = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIndex, setDetailIndex] = useState(0);
  // 原生弹窗负责焦点约束和 Esc 关闭，关闭后回到画廊。
  useEffect(() => {
    const dialog = detailRef.current;
    if (!dialog) return;
    if (detailOpen && !dialog.open) dialog.showModal();
    if (!detailOpen && dialog.open) dialog.close();
  }, [detailOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let raf = 0;
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startOffset = 0;
    let lastX = 0;
    let lastPointerTime = performance.now();
    let pointerX = -1000;
    let pointerY = -1000;
    let current = 0;
    let target = 0;
    let velocity = 0;
    let ribbonVelocity = 0;
    let lastTime = performance.now();
    let intro = 0;
    let introOn = false;
    let vw = 1, vh = 1, cardH = 1, total = 1, halfW = 1, halfH = 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0);
    const camera = new THREE.PerspectiveCamera(53.4, 1, .1, 2000);
    camera.position.z = 41.18;
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: "high-performance"});
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;

    const geometry = new THREE.PlaneGeometry(1, 1, 48, 24);
    const items: Item[] = [];
    const uniforms = (texture: THREE.Texture, width: number, height: number, label = false, revealTexture = texture, special = false) => ({
      uTexture: {value: texture}, uRevealTexture: {value: revealTexture}, uMedia: {value: new THREE.Vector2(width, height)},
      uRes: {value: new THREE.Vector2(1, 1)}, uAlpha: {value: 0}, uCorner: {value: .052},
      uW: {value: 1}, uD: {value: 1}, uT: {value: 1.15}, uV: {value: 0},
      uLean: {value: 0}, uHover: {value: 0}, uDent: {value: .1}, uLabel: {value: label ? 1 : 0},
      uSpecial: {value: special ? 1 : 0}, uRipple: {value: 0}, uWaveTime: {value: 0}, uPointer: {value: new THREE.Vector2(.5, .5)},
    });

    const floorMat = new THREE.ShaderMaterial({vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: {uAlpha: {value: 0}}, transparent: true, depthTest: false, depthWrite: false});
    const floorGeo = new THREE.PlaneGeometry(1, 1);
    floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);

    async function makeItem(index: number) {
      const card = cards[index];
      let texture: THREE.Texture;
      let revealTexture: THREE.Texture | undefined;
      let video: HTMLVideoElement | undefined;
      if (index === 0) {
        const loader = new THREE.TextureLoader();
        [texture, revealTexture] = await Promise.all([
          loader.loadAsync(card[4]),
          loader.loadAsync(card[4]),
        ]);
      } else if (card[5]) {
        video = document.createElement("video");
        video.src = card[4]; video.muted = true; video.loop = true; video.playsInline = true; video.preload = "auto";
        await new Promise<void>((resolve) => {
          let finished = false;
          const done = () => {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeout);
            video!.removeEventListener("canplay", done);
            video!.removeEventListener("error", done);
            resolve();
          };
          const timeout = window.setTimeout(done, 2400);
          if (video!.readyState >= 2) done();
          else {
            video!.addEventListener("canplay", done, {once: true});
            video!.addEventListener("error", done, {once: true});
            video!.load();
          }
        });
        texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false;
      } else texture = await new THREE.TextureLoader().loadAsync(card[4]);
      texture.colorSpace = THREE.SRGBColorSpace;
      if (revealTexture) revealTexture.colorSpace = THREE.SRGBColorSpace;
      const cardUniforms = uniforms(texture, card[2], card[3], false, revealTexture, index === 0);
      const material = new THREE.ShaderMaterial({vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms: cardUniforms, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false});
      const mesh = new THREE.Mesh(geometry, material); mesh.renderOrder = 10;
      const lt = labelTexture(card[2] / card[3]);
      const lm = new THREE.ShaderMaterial({vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms: uniforms(lt, card[2], card[3], true, lt, index === 0), transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false});
      const label = new THREE.Mesh(geometry, lm); label.renderOrder = 20;
      scene.add(mesh, label);
      items.push({
        index, mesh, label, texture, revealTexture, video, left: 0, width: 0, hover: 0, ripple: 0, waveTime: 0, pointer: new THREE.Vector2(.5, .5),
        screen: {left: Number.POSITIVE_INFINITY, right: Number.NEGATIVE_INFINITY, top: Number.POSITIVE_INFINITY, bottom: Number.NEGATIVE_INFINITY},
      });
    }

    Promise.allSettled(cards.map((_, i) => makeItem(i))).then(() => {
      if (disposed) return;
      items.sort((a, b) => a.index - b.index);
      resize();
      const first = items[0];
      if (first) {
        const openingAnchor = vw * .5;
        current = target = openingAnchor - (first.left + first.width / 2);
      }
      items.forEach((item) => void item.video?.play().catch(() => {}));
      window.setTimeout(() => { introOn = true; setReady(true); }, 820);
    });

    function resize() {
      vw = Math.max(1, canvas!.clientWidth); vh = Math.max(1, canvas!.clientHeight);
      renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
      halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z;
      halfW = halfH * camera.aspect;
      cardH = Math.min(vh * .435, 550);
      let x = 0;
      items.forEach((item) => { item.left = x; item.width = cardH * cards[item.index][2] / cards[item.index][3]; x += item.width + 10; });
      // 循环画廊的末张与首张之间，也需保留同样的 10px 间距。
      total = Math.max(1, x);
      const worldCardH = halfH * 2 * cardH / vh;
      floor.position.set(0, -worldCardH / 2 - halfH * .06, -39);
      floor.scale.set(halfW * 8, 1, halfH * 12);
    }

    function centerOf(item: Item) {
      const raw = item.left + item.width / 2 + current;
      return vw / 2 + wrap(raw - vw / 2, total);
    }
    function hit(x: number, y: number) {
      const candidates = items.filter((item) => {
        const b = item.screen;
        if (Number.isFinite(b.left)) return x >= b.left - 8 && x <= b.right + 8 && y >= b.top - 8 && y <= b.bottom + 8;
        return Math.abs(x - centerOf(item)) <= item.width / 2 && y >= (vh - cardH) / 2 && y <= (vh + cardH) / 2;
      });
      return candidates.sort((a, b) => {
        const ac = (a.screen.left + a.screen.right) / 2;
        const bc = (b.screen.left + b.screen.right) / 2;
        return Math.abs(x - ac) - Math.abs(x - bc);
      })[0] ?? null;
    }

    const projected = new THREE.Vector3();
    function updateScreenBounds(item: Item, wx: number, ww: number, wh: number, depth: number, lean: number, sheetV: number) {
      let left = Number.POSITIVE_INFINITY, right = Number.NEGATIVE_INFINITY;
      let top = Number.POSITIVE_INFINITY, bottom = Number.NEGATIVE_INFINITY;
      for (let ix = 0; ix <= 6; ix++) {
        for (let iy = 0; iy <= 4; iy++) {
          const x = wx + (ix / 6 - .5) * ww;
          let y = (iy / 4 - .5) * wh;
          let z = 0;
          const curveQ = x / Math.max(halfW, .0001) * 1.15 - .2;
          const curveSlope = (Math.PI * Math.cos(Math.PI * curveQ) - 2 * curveQ * Math.sin(Math.PI * curveQ)) * Math.exp(-curveQ * curveQ);
          const edge = THREE.MathUtils.smoothstep(Math.abs(x / halfW), .3, .9);
          const roll = -.16 * curveSlope / Math.PI + 1.8 * sheetV * edge * Math.sign(x);
          const s = Math.sin(roll), c = Math.cos(roll);
          const rotatedY = y * c - z * s;
          z = y * s + z * c;
          y = rotatedY;
          z += -depth * Math.sin(Math.PI * curveQ) * Math.exp(-curveQ * curveQ);
          y += .03 * x;
          const side = 1 - THREE.MathUtils.smoothstep(x / halfW, -1, .3);
          y += .1 * halfW * sheetV * side;
          z += .2 * halfW * sheetV * side;
          const normalized = THREE.MathUtils.clamp(x / halfW, -1, 1);
          z += lean * normalized * (1.5 - .5 * normalized * normalized);
          projected.set(x, y, z).project(camera);
          const sx = (projected.x * .5 + .5) * vw;
          const sy = (-projected.y * .5 + .5) * vh;
          left = Math.min(left, sx); right = Math.max(right, sx);
          top = Math.min(top, sy); bottom = Math.max(bottom, sy);
        }
      }
      item.screen = {left, right, top, bottom};
    }
    function down(event: PointerEvent) {
      if (event.button !== 0) return;
      dragging = true; moved = false; startX = event.clientX; startOffset = target; lastX = event.clientX; lastPointerTime = performance.now(); velocity = 0;
      pointerX = event.clientX; pointerY = event.clientY; canvas!.setPointerCapture(event.pointerId); canvas!.style.cursor = "grabbing";
    }
    function move(event: PointerEvent) {
      pointerX = event.clientX; pointerY = event.clientY;
      if (!dragging) return;
      const dx = event.clientX - startX; if (Math.abs(dx) > 3) moved = true; target = startOffset + dx;
      const now = performance.now(), elapsed = Math.max(8, now - lastPointerTime);
      velocity = (event.clientX - lastX) / elapsed * 1000; lastX = event.clientX; lastPointerTime = now;
    }
    function up(event: PointerEvent) {
      if (!dragging) return; dragging = false; canvas!.style.cursor = "grab";
      if (!moved) {
        const picked = hit(event.clientX, event.clientY);
        if (picked) {
          const distanceToCenter = vw / 2 - centerOf(picked);
          const centered = Math.abs(distanceToCenter) < Math.min(24, vw * .04);
          const settled = Math.abs(target - current) < 3 && Math.abs(ribbonVelocity) < .03;
          velocity = 0;
          if (centered && settled) {
            // 每张卡片遵循同一规则：居中停稳后点击，打开自己的详情。
            setDetailIndex(picked.index);
            setDetailOpen(true);
          } else {
            target = current + distanceToCenter;
          }
        }
      }
    }
    function cancelDrag() { dragging = false; moved = true; velocity = 0; canvas!.style.cursor = "grab"; }
    function leave() { pointerX = -1000; pointerY = -1000; if (!dragging) canvas!.style.cursor = "grab"; }
    function wheel(event: WheelEvent) {
      event.preventDefault();
      const delta = event.deltaX + event.deltaY;
      target -= delta;
      velocity = THREE.MathUtils.clamp(velocity - delta * 7.5, -2200, 2200);
    }
    function key(event: KeyboardEvent) {
      if (detailRef.current?.open) return;
      if (event.key === "Escape") setDetailOpen(false);
      if (event.key === "ArrowLeft") { target += 420; velocity = 0; }
      if (event.key === "ArrowRight") { target -= 420; velocity = 0; }
    }

    function animate(time: number) {
      const dt = Math.min(.05, Math.max(.004, (time - lastTime) / 1000)); lastTime = time;
      if (introOn) intro += (1 - intro) * (1 - Math.exp(-5.2 * dt));
      if (!dragging && Math.abs(velocity) > 1) { target += velocity * dt; velocity *= Math.exp(-3.05 * dt); } else if (!dragging) velocity = 0;
      current += (target - current) * (1 - Math.exp(-(dragging ? 15.5 : 7.4) * dt));
      if (Math.abs(current) > total * 2) { current = wrap(current, total); target = current; }
      const signedSpeed = velocity + (target - current) * 6.2;
      const wantedRibbonVelocity = .52 * Math.tanh(signedSpeed / 720);
      const ribbonRate = Math.abs(wantedRibbonVelocity) > Math.abs(ribbonVelocity) ? 10.5 : 3.15;
      ribbonVelocity += (wantedRibbonVelocity - ribbonVelocity) * (1 - Math.exp(-ribbonRate * dt));
      const sheetV = ribbonVelocity;
      const motion = Math.abs(sheetV);
      const depth = halfW * .19 * (1 + 1.7 * motion);
      const lean = halfW * (-.045 - .17 * sheetV);
      const px = pointerX < 0 ? vw / 2 : pointerX;
      const py = pointerY < 0 ? vh / 2 : pointerY;
      const camTargetX = (px / vw - .5) * 2.2;
      const camTargetY = -(py / vh - .5) * 1.0;
      camera.position.x += (camTargetX - camera.position.x) * (1 - Math.exp(-3.5 * dt));
      camera.position.y += (camTargetY - camera.position.y) * (1 - Math.exp(-3.5 * dt));
      camera.lookAt(0, 0, 0);
      items.forEach((item) => {
        const px = centerOf(item), ww = halfW * 2 * item.width / vw, wh = halfH * 2 * cardH / vh;
        const wx = -halfW + px / vw * halfW * 2;
        updateScreenBounds(item, wx, ww, wh, depth, lean, sheetV);
        for (const mesh of [item.mesh, item.label]) {
          mesh.position.set(wx, 0, 0); mesh.scale.set(ww, wh, 1);
          const tilt = item.hover * .10;
          mesh.rotation.x = (item.pointer.y - .5) * -tilt;
          mesh.rotation.y = (item.pointer.x - .5) * tilt;
          const u = mesh.material.uniforms;
          u.uRes.value.set(ww, wh); u.uW.value = halfW; u.uD.value = depth; u.uT.value = 1.15; u.uV.value = sheetV; u.uLean.value = lean; u.uHover.value = item.hover; u.uAlpha.value = intro;
        }
      });
      const hovered = dragging ? null : hit(pointerX, pointerY);
      items.forEach((item) => {
        const wanted = item === hovered ? 1 : 0;
        item.hover += (wanted - item.hover) * (1 - Math.exp(-(wanted ? 13.5 : 10.5) * dt));
        if (item.index === 0) item.ripple = THREE.MathUtils.clamp(item.ripple + (wanted ? dt / 1.55 : -dt / .8), 0, 1);
        else item.ripple += (wanted - item.ripple) * (1 - Math.exp(-(wanted ? 7.5 : 9) * dt));
        if (wanted) item.waveTime += dt;
        else if (item.ripple < .01) item.waveTime = 0;
        if (wanted) {
          const b = item.screen;
          const nextX = THREE.MathUtils.clamp((pointerX - b.left) / Math.max(1, b.right - b.left), .08, .92);
          const nextY = THREE.MathUtils.clamp(1 - (pointerY - b.top) / Math.max(1, b.bottom - b.top), .1, .9);
          item.pointer.lerp(new THREE.Vector2(nextX, nextY), 1 - Math.exp(-10 * dt));
        }
        for (const mesh of [item.mesh, item.label]) {
          const u = mesh.material.uniforms;
          u.uHover.value = item.hover;
          u.uRipple.value = item.ripple;
          u.uWaveTime.value = item.waveTime;
          u.uPointer.value.copy(item.pointer);
        }
      });
      canvas!.dataset.hoveredCard = hovered ? String(hovered.index) : "none";
      canvas!.dataset.nathanRipple = items[0] ? items[0].ripple.toFixed(3) : "0";
      canvas!.dataset.rippleValues = items.map((item) => item.ripple.toFixed(3)).join(",");
      if (!dragging) canvas!.style.cursor = hovered ? "pointer" : "grab";
      floorMat.uniforms.uAlpha.value = intro * .82;
      renderer.render(scene, camera); raf = requestAnimationFrame(animate);
    }

    resize(); window.addEventListener("resize", resize); window.addEventListener("keydown", key);
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", cancelDrag); canvas.addEventListener("pointerleave", leave); canvas.addEventListener("wheel", wheel, {passive: false});
    raf = requestAnimationFrame(animate);
    return () => {
      disposed = true; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("keydown", key);
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", cancelDrag); canvas.removeEventListener("pointerleave", leave); canvas.removeEventListener("wheel", wheel);
      items.forEach((item) => { item.video?.pause(); item.texture.dispose(); item.revealTexture?.dispose(); (item.label.material.uniforms.uTexture.value as THREE.Texture).dispose(); item.mesh.material.dispose(); item.label.material.dispose(); });
      geometry.dispose(); floorGeo.dispose(); floorMat.dispose(); renderer.dispose();
    };
  }, []);

  return <main className="gallery-stage">
    <header className="site-header"><span>Portfolio</span><span>2026</span></header>
    <canvas ref={canvasRef} className="webgl-gallery" data-testid="webgl-gallery" aria-label="Draggable WebGL project gallery" tabIndex={0} />
    <footer className="site-footer"><nav aria-label="Project views"><strong>TANG</strong></nav><span>UPDATING...</span></footer>
    <div className={`loading-screen${ready ? " is-hidden" : ""}`} aria-hidden="true"><i/><i/><i/></div>
    <dialog ref={detailRef} className="detail-overlay" aria-labelledby="detail-title"
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          event.currentTarget.querySelector("button")?.focus();
        }
      }}
      onClose={() => { setDetailOpen(false); canvasRef.current?.focus({ preventScroll: true }); }}>
      <header className="detail-header">
        <h2 id="detail-title">{cards[detailIndex][1]}</h2>
        <button className="detail-hit-close" onClick={() => setDetailOpen(false)} aria-label="关闭详情">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </header>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="detail-portrait" src={cards[detailIndex][4]} alt={cards[detailIndex][1]}/>
      <footer className="detail-caption">TANG / TO BE ADDED</footer>
    </dialog>
  </main>;
}
