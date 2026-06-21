import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

type PixelBlastVariant = "square" | "circle" | "triangle" | "diamond";

interface ReinitConfig {
  antialias: boolean;
}

interface PixelBlastRuntimeConfig extends ReinitConfig {
  autoPauseOffscreen: boolean;
  color: string;
  edgeFade: number;
  enableRipples: boolean;
  patternDensity: number;
  patternScale: number;
  pixelSize: number;
  pixelSizeJitter: number;
  rippleIntensityScale: number;
  rippleSpeed: number;
  rippleThickness: number;
  transparent: boolean;
  variant: PixelBlastVariant;
}

const PIXEL_BLAST_CONFIG = {
  antialias: true,
  autoPauseOffscreen: true,
  color: "#669c35",
  edgeFade: 0.25,
  enableRipples: true,
  patternDensity: 1,
  patternScale: 2,
  pixelSize: 4,
  pixelSizeJitter: 0,
  rippleIntensityScale: 1.5,
  rippleSpeed: 0.4,
  rippleThickness: 0.12,
  speed: 0.5,
  transparent: true,
  variant: "square",
} satisfies PixelBlastRuntimeConfig & { speed: number };

interface PixelBlastUniforms {
  uClickPos: { value: THREE.Vector2[] };
  uClickTimes: { value: Float32Array };
  uColor: { value: THREE.Color };
  uDensity: { value: number };
  uEdgeFade: { value: number };
  uEnableRipples: { value: number };
  uPixelJitter: { value: number };
  uPixelSize: { value: number };
  uResolution: { value: THREE.Vector2 };
  uRippleIntensity: { value: number };
  uRippleSpeed: { value: number };
  uRippleThickness: { value: number };
  uScale: { value: number };
  uShapeType: { value: number };
  uTime: { value: number };
}

interface PixelBlastState {
  camera: THREE.OrthographicCamera;
  clickIndex: number;
  clock: THREE.Clock;
  handlePointerDown: ((event: PointerEvent) => void) | undefined;
  handlePointerMove: ((event: PointerEvent) => void) | undefined;
  material: THREE.ShaderMaterial;
  quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | undefined;
  rafId: number | undefined;
  renderer: THREE.WebGLRenderer;
  resizeObserver: ResizeObserver | undefined;
  scene: THREE.Scene;
  timeOffset: number | undefined;
  uniforms: PixelBlastUniforms;
}

interface PixelBlastRefs {
  speed: RefObject<number>;
  state: RefObject<PixelBlastState | null>;
  visibility: RefObject<{ visible: boolean }>;
}

const SHAPE_MAP: Record<PixelBlastVariant, number> = {
  circle: 1,
  diamond: 3,
  square: 0,
  triangle: 2,
};

const MAX_CLICKS = 10;

function randomFloat() {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return (values.at(0) ?? 0) / 4_294_967_295;
  }

  return Math.random();
}

const VERTEX_SOURCE = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SOURCE = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; i += 1){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;

  float feed = base + (uDensity - 0.5) * 0.3;

  float speed = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT = 1.0;
  const float dampR = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; i += 1){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float clickCellPixelSize = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - clickCellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float mask;
  if (uShapeType == SHAPE_CIRCLE) mask = maskCircle(pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) mask = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND) mask = maskDiamond(pixelUV, coverage);
  else mask = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    mask *= fade;
  }

  vec3 srgbColor = mix(
    uColor * 12.92,
    1.055 * pow(uColor, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, uColor)
  );

  fragColor = vec4(srgbColor, mask);
}
`;

function disposeState(
  container: HTMLDivElement,
  state: PixelBlastState | null
) {
  if (!state) {
    return;
  }

  if (state.resizeObserver) {
    state.resizeObserver.disconnect();
  }

  if (state.handlePointerDown) {
    state.renderer.domElement.removeEventListener(
      "pointerdown",
      state.handlePointerDown
    );
  }

  if (state.handlePointerMove) {
    state.renderer.domElement.removeEventListener(
      "pointermove",
      state.handlePointerMove
    );
  }

  if (state.rafId !== undefined) {
    cancelAnimationFrame(state.rafId);
  }

  if (state.quad) {
    state.quad.geometry.dispose();
  }

  state.material.dispose();
  state.renderer.dispose();
  state.renderer.forceContextLoss();

  if (state.renderer.domElement.parentElement === container) {
    state.renderer.domElement.remove();
  }
}

function applyRendererTransparency(
  renderer: THREE.WebGLRenderer,
  transparent: boolean
) {
  if (transparent) {
    renderer.setClearAlpha(0);
    return;
  }

  renderer.setClearColor(0, 1);
}

function shouldReinitPixelBlast(
  previousConfig: ReinitConfig | null,
  config: ReinitConfig,
  state: PixelBlastState | null
): boolean {
  return (
    !previousConfig ||
    previousConfig.antialias !== config.antialias ||
    state === null
  );
}

function createPixelBlastUniforms(
  renderer: THREE.WebGLRenderer,
  config: PixelBlastRuntimeConfig
): PixelBlastUniforms {
  return {
    uClickPos: {
      value: Array.from(
        { length: MAX_CLICKS },
        () => new THREE.Vector2(-1, -1)
      ),
    },
    uClickTimes: { value: new Float32Array(MAX_CLICKS) },
    uColor: { value: new THREE.Color(config.color) },
    uDensity: { value: config.patternDensity },
    uEdgeFade: { value: config.edgeFade },
    uEnableRipples: { value: config.enableRipples ? 1 : 0 },
    uPixelJitter: { value: config.pixelSizeJitter },
    uPixelSize: { value: config.pixelSize * renderer.getPixelRatio() },
    uResolution: { value: new THREE.Vector2(0, 0) },
    uRippleIntensity: { value: config.rippleIntensityScale },
    uRippleSpeed: { value: config.rippleSpeed },
    uRippleThickness: { value: config.rippleThickness },
    uScale: { value: config.patternScale },
    uShapeType: { value: SHAPE_MAP[config.variant] ?? 0 },
    uTime: { value: 0 },
  };
}

function createBasePixelBlastScene(uniforms: PixelBlastUniforms) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: FRAGMENT_SOURCE,
    glslVersion: THREE.GLSL3,
    transparent: true,
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: VERTEX_SOURCE,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(quad);

  return { camera, material, quad, scene };
}

function createPixelBlastRenderer(
  container: HTMLDivElement,
  config: PixelBlastRuntimeConfig
): THREE.WebGLRenderer {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: config.antialias,
    canvas,
    powerPreference: "high-performance",
  });

  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.append(renderer.domElement);
  applyRendererTransparency(renderer, config.transparent);

  return renderer;
}

function createPixelBlastResizeObserver({
  container,
  pixelSize,
  renderer,
  uniforms,
}: {
  container: HTMLDivElement;
  pixelSize: number;
  renderer: THREE.WebGLRenderer;
  uniforms: PixelBlastUniforms;
}): ResizeObserver {
  const updateSize = () => {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    renderer.setSize(width, height, false);
    uniforms.uResolution.value.set(
      renderer.domElement.width,
      renderer.domElement.height
    );
    uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
  };

  updateSize();

  const resizeObserver = new ResizeObserver(updateSize);
  resizeObserver.observe(container);

  return resizeObserver;
}

function createPixelBlastPointerHandlers({
  renderer,
  stateRef,
  uniforms,
}: {
  renderer: THREE.WebGLRenderer;
  stateRef: RefObject<PixelBlastState | null>;
  uniforms: PixelBlastUniforms;
}): Pick<PixelBlastState, "handlePointerDown" | "handlePointerMove"> {
  const mapToPixels = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const scaleX = renderer.domElement.width / rect.width;
    const scaleY = renderer.domElement.height / rect.height;
    const fx = (event.clientX - rect.left) * scaleX;
    const fy = (rect.height - (event.clientY - rect.top)) * scaleY;

    return {
      fx,
      fy,
      h: renderer.domElement.height,
      w: renderer.domElement.width,
    };
  };

  const handlePointerDown = (event: PointerEvent) => {
    const { fx, fy } = mapToPixels(event);
    const clickIndex = stateRef.current?.clickIndex ?? 0;
    const clickPoint = uniforms.uClickPos.value[clickIndex];

    if (!clickPoint) {
      return;
    }

    clickPoint.set(fx, fy);
    uniforms.uClickTimes.value[clickIndex] = uniforms.uTime.value;

    if (stateRef.current) {
      stateRef.current.clickIndex = (clickIndex + 1) % MAX_CLICKS;
    }
  };

  renderer.domElement.addEventListener("pointerdown", handlePointerDown, {
    passive: true,
  });

  return { handlePointerDown, handlePointerMove: undefined };
}

function renderPixelBlastFrame({
  camera,
  renderer,
  scene,
  time,
  uniforms,
}: {
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  time: number;
  uniforms: PixelBlastUniforms;
}) {
  uniforms.uTime.value = time;
  renderer.render(scene, camera);
}

function createPixelBlastAnimator({
  autoPauseOffscreen,
  camera,
  clock,
  refs,
  renderer,
  scene,
  timeOffset,
  uniforms,
}: {
  autoPauseOffscreen: boolean;
  camera: THREE.OrthographicCamera;
  clock: THREE.Clock;
  refs: PixelBlastRefs;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  timeOffset: number;
  uniforms: PixelBlastUniforms;
}) {
  function animate() {
    if (!autoPauseOffscreen || refs.visibility.current.visible) {
      renderPixelBlastFrame({
        camera,
        renderer,
        scene,
        time: timeOffset + clock.getElapsedTime() * refs.speed.current,
        uniforms,
      });
    }

    const nextFrame = requestAnimationFrame(animate);

    if (refs.state.current) {
      refs.state.current.rafId = nextFrame;
    }
  }

  return animate;
}

function createPixelBlastState({
  config,
  container,
  refs,
}: {
  config: PixelBlastRuntimeConfig;
  container: HTMLDivElement;
  refs: PixelBlastRefs;
}): PixelBlastState {
  const renderer = createPixelBlastRenderer(container, config);
  const uniforms = createPixelBlastUniforms(renderer, config);
  const { camera, material, quad, scene } = createBasePixelBlastScene(uniforms);
  const resizeObserver = createPixelBlastResizeObserver({
    container,
    pixelSize: config.pixelSize,
    renderer,
    uniforms,
  });
  const { handlePointerDown, handlePointerMove } =
    createPixelBlastPointerHandlers({
      renderer,
      stateRef: refs.state,
      uniforms,
    });
  const clock = new THREE.Clock();
  const timeOffset = randomFloat() * 1000;
  const animate = createPixelBlastAnimator({
    autoPauseOffscreen: config.autoPauseOffscreen,
    camera,
    clock,
    refs,
    renderer,
    scene,
    timeOffset,
    uniforms,
  });

  return {
    camera,
    clickIndex: 0,
    clock,
    handlePointerDown,
    handlePointerMove,
    material,
    quad,
    rafId: requestAnimationFrame(animate),
    renderer,
    resizeObserver,
    scene,
    timeOffset,
    uniforms,
  };
}

function updatePixelBlastState(
  state: PixelBlastState,
  config: PixelBlastRuntimeConfig
) {
  state.uniforms.uShapeType.value = SHAPE_MAP[config.variant] ?? 0;
  state.uniforms.uPixelSize.value =
    config.pixelSize * state.renderer.getPixelRatio();
  state.uniforms.uColor.value.set(config.color);
  state.uniforms.uScale.value = config.patternScale;
  state.uniforms.uDensity.value = config.patternDensity;
  state.uniforms.uPixelJitter.value = config.pixelSizeJitter;
  state.uniforms.uEnableRipples.value = config.enableRipples ? 1 : 0;
  state.uniforms.uRippleIntensity.value = config.rippleIntensityScale;
  state.uniforms.uRippleThickness.value = config.rippleThickness;
  state.uniforms.uRippleSpeed.value = config.rippleSpeed;
  state.uniforms.uEdgeFade.value = config.edgeFade;

  applyRendererTransparency(state.renderer, config.transparent);
}

export function usePixelBlastRenderer(
  containerRef: RefObject<HTMLDivElement | null>
) {
  const speedRef = useRef(PIXEL_BLAST_CONFIG.speed);
  const threeRef = useRef<PixelBlastState | null>(null);
  const prevConfigRef = useRef<ReinitConfig | null>(null);
  const visibilityRef = useRef({ visible: true });

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !PIXEL_BLAST_CONFIG.autoPauseOffscreen) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibilityRef.current.visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.01 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    speedRef.current = PIXEL_BLAST_CONFIG.speed;

    const config: ReinitConfig = {
      antialias: PIXEL_BLAST_CONFIG.antialias,
    };
    const needsReinit = shouldReinitPixelBlast(
      prevConfigRef.current,
      config,
      threeRef.current
    );
    if (needsReinit) {
      disposeState(container, threeRef.current);
      threeRef.current = null;

      threeRef.current = createPixelBlastState({
        config: PIXEL_BLAST_CONFIG,
        container,
        refs: {
          speed: speedRef,
          state: threeRef,
          visibility: visibilityRef,
        },
      });
    } else if (threeRef.current) {
      updatePixelBlastState(threeRef.current, PIXEL_BLAST_CONFIG);
    }

    prevConfigRef.current = config;
    const state = threeRef.current;

    return () => {
      disposeState(container, state);
      if (threeRef.current === state) {
        threeRef.current = null;
      }
    };
  }, [containerRef]);
}
