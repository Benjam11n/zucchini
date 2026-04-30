/* oxlint-disable eslint(complexity) */
import { Effect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

type PixelBlastVariant = "square" | "circle" | "triangle" | "diamond";

interface TouchPoint {
  age: number;
  force: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface NormalizedPoint {
  x: number;
  y: number;
}

interface TouchTexture {
  addTouch: (point: NormalizedPoint) => void;
  canvas: HTMLCanvasElement;
  radiusScale: number;
  size: number;
  texture: THREE.Texture;
  update: () => void;
}

interface ReinitConfig {
  antialias: boolean;
  liquid: boolean;
  noiseAmount: number;
}

export interface PixelBlastRendererOptions {
  antialias?: boolean;
  autoPauseOffscreen?: boolean;
  color?: string;
  edgeFade?: number;
  enableRipples?: boolean;
  liquid?: boolean;
  liquidRadius?: number;
  liquidStrength?: number;
  liquidWobbleSpeed?: number;
  noiseAmount?: number;
  patternDensity?: number;
  patternScale?: number;
  pixelSize?: number;
  pixelSizeJitter?: number;
  rippleIntensityScale?: number;
  rippleSpeed?: number;
  rippleThickness?: number;
  speed?: number;
  transparent?: boolean;
  variant?: PixelBlastVariant;
}

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
  composer: EffectComposer | undefined;
  handlePointerDown: ((event: PointerEvent) => void) | undefined;
  handlePointerMove: ((event: PointerEvent) => void) | undefined;
  liquidEffect: Effect | undefined;
  material: THREE.ShaderMaterial;
  quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | undefined;
  rafId: number | undefined;
  renderer: THREE.WebGLRenderer;
  resizeObserver: ResizeObserver | undefined;
  scene: THREE.Scene;
  timeOffset: number | undefined;
  touch: TouchTexture | undefined;
  uniforms: PixelBlastUniforms;
}

const SHAPE_MAP: Record<PixelBlastVariant, number> = {
  circle: 1,
  diamond: 3,
  square: 0,
  triangle: 2,
};

const MAX_CLICKS = 10;

const easeOutSine = (value: number) => Math.sin((value * Math.PI) / 2);
const easeOutQuad = (value: number) => -value * (value - 2);

function randomFloat() {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return (values.at(0) ?? 0) / 4_294_967_295;
  }

  return Math.random();
}

function syncPassTime(effectPass: EffectPass, time: number) {
  const passWithEffects = effectPass as unknown as {
    effects: (Effect & { uniforms: Map<string, THREE.Uniform> })[];
  };

  for (const effect of passWithEffects.effects) {
    const timeUniform = effect.uniforms.get("uTime");

    if (timeUniform) {
      timeUniform.value = time;
    }
  }
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

function createTouchTexture(): TouchTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D context not available");
  }

  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const trail: TouchPoint[] = [];
  let lastPoint: NormalizedPoint | null = null;
  const maxAge = 64;
  let radius = 0.1 * size;
  const trailSpeed = 1 / maxAge;

  const clear = () => {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawPoint = (point: TouchPoint) => {
    const position = {
      x: point.x * size,
      y: (1 - point.y) * size,
    };
    let intensity =
      point.age < maxAge * 0.3
        ? easeOutSine(point.age / (maxAge * 0.3))
        : easeOutQuad(1 - (point.age - maxAge * 0.3) / (maxAge * 0.7)) || 0;

    intensity *= point.force;

    const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = size * 5;

    context.shadowOffsetX = offset;
    context.shadowOffsetY = offset;
    context.shadowBlur = radius;
    context.shadowColor = `rgba(${color}, ${0.22 * intensity})`;
    context.beginPath();
    context.fillStyle = "rgba(255, 0, 0, 1)";
    context.arc(
      position.x - offset,
      position.y - offset,
      radius,
      0,
      Math.PI * 2
    );
    context.fill();
  };

  return {
    addTouch: (point) => {
      let force = 0;
      let vx = 0;
      let vy = 0;

      if (lastPoint) {
        const dx = point.x - lastPoint.x;
        const dy = point.y - lastPoint.y;

        if (dx === 0 && dy === 0) {
          return;
        }

        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);
        vx = dx / (distance || 1);
        vy = dy / (distance || 1);
        force = Math.min(distanceSquared * 10_000, 1);
      }

      lastPoint = { x: point.x, y: point.y };
      trail.push({ age: 0, force, vx, vy, x: point.x, y: point.y });
    },
    canvas,
    get radiusScale() {
      return radius / (0.1 * size);
    },
    set radiusScale(value: number) {
      radius = 0.1 * size * value;
    },
    size,
    texture,
    update: () => {
      clear();

      for (let index = trail.length - 1; index >= 0; index -= 1) {
        const point = trail[index];

        if (!point) {
          continue;
        }

        const force = point.force * trailSpeed * (1 - point.age / maxAge);
        point.x += point.vx * force;
        point.y += point.vy * force;
        point.age += 1;

        if (point.age > maxAge) {
          trail.splice(index, 1);
        }
      }

      for (const point of trail) {
        drawPoint(point);
      }

      texture.needsUpdate = true;
    },
  };
}

function createLiquidEffect(
  texture: THREE.Texture,
  options?: { freq?: number; strength?: number }
) {
  const fragmentSource = `
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;

    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b;
      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.2831853);
      float amt = uStrength * intensity * wave;
      uv += vec2(vx, vy) * amt;
    }
  `;

  return new Effect("LiquidEffect", fragmentSource, {
    uniforms: new Map<string, THREE.Uniform>([
      ["uFreq", new THREE.Uniform(options?.freq ?? 4.5)],
      ["uStrength", new THREE.Uniform(options?.strength ?? 0.025)],
      ["uTexture", new THREE.Uniform(texture)],
      ["uTime", new THREE.Uniform(0)],
    ]),
  });
}

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
  state.composer?.dispose();
  state.renderer.dispose();
  state.renderer.forceContextLoss();

  if (state.renderer.domElement.parentElement === container) {
    state.renderer.domElement.remove();
  }
}

export function usePixelBlastRenderer(
  containerRef: RefObject<HTMLDivElement | null>,
  {
    antialias = true,
    autoPauseOffscreen = true,
    color = "#B19EEF",
    edgeFade = 0.5,
    enableRipples = true,
    liquid = false,
    liquidRadius = 1,
    liquidStrength = 0.1,
    liquidWobbleSpeed = 4.5,
    noiseAmount = 0,
    patternDensity = 1,
    patternScale = 2,
    pixelSize = 3,
    pixelSizeJitter = 0,
    rippleIntensityScale = 1,
    rippleSpeed = 0.3,
    rippleThickness = 0.1,
    speed = 0.5,
    transparent = true,
    variant = "square",
  }: PixelBlastRendererOptions
) {
  const speedRef = useRef(speed);
  const threeRef = useRef<PixelBlastState | null>(null);
  const prevConfigRef = useRef<ReinitConfig | null>(null);
  const visibilityRef = useRef({ visible: true });

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !autoPauseOffscreen) {
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
  }, [autoPauseOffscreen, containerRef]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    speedRef.current = speed;

    const config: ReinitConfig = {
      antialias,
      liquid,
      noiseAmount,
    };
    const previousConfig = prevConfigRef.current;
    const needsReinit =
      !previousConfig ||
      previousConfig.antialias !== config.antialias ||
      previousConfig.liquid !== config.liquid ||
      previousConfig.noiseAmount !== config.noiseAmount ||
      threeRef.current === null;

    if (needsReinit) {
      disposeState(container, threeRef.current);
      threeRef.current = null;

      const canvas = document.createElement("canvas");
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias,
        canvas,
        powerPreference: "high-performance",
      });

      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.append(renderer.domElement);

      if (transparent) {
        renderer.setClearAlpha(0);
      } else {
        renderer.setClearColor(0, 1);
      }

      const uniforms: PixelBlastUniforms = {
        uClickPos: {
          value: Array.from(
            { length: MAX_CLICKS },
            () => new THREE.Vector2(-1, -1)
          ),
        },
        uClickTimes: { value: new Float32Array(MAX_CLICKS) },
        uColor: { value: new THREE.Color(color) },
        uDensity: { value: patternDensity },
        uEdgeFade: { value: edgeFade },
        uEnableRipples: { value: enableRipples ? 1 : 0 },
        uPixelJitter: { value: pixelSizeJitter },
        uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
        uResolution: { value: new THREE.Vector2(0, 0) },
        uRippleIntensity: { value: rippleIntensityScale },
        uRippleSpeed: { value: rippleSpeed },
        uRippleThickness: { value: rippleThickness },
        uScale: { value: patternScale },
        uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
        uTime: { value: 0 },
      };

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

      const clock = new THREE.Clock();
      const updateSize = () => {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;

        renderer.setSize(width, height, false);
        uniforms.uResolution.value.set(
          renderer.domElement.width,
          renderer.domElement.height
        );

        if (threeRef.current?.composer) {
          threeRef.current.composer.setSize(
            renderer.domElement.width,
            renderer.domElement.height
          );
        }

        uniforms.uPixelSize.value = pixelSize * renderer.getPixelRatio();
      };

      updateSize();

      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);

      const timeOffset = randomFloat() * 1000;
      let composer: EffectComposer | undefined;
      let touch: TouchTexture | undefined;
      let liquidEffect: Effect | undefined;

      if (liquid) {
        touch = createTouchTexture();
        touch.radiusScale = liquidRadius;

        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        liquidEffect = createLiquidEffect(touch.texture, {
          freq: liquidWobbleSpeed,
          strength: liquidStrength,
        });

        const effectPass = new EffectPass(camera, liquidEffect);
        effectPass.renderToScreen = true;
        composer.addPass(effectPass);
      }

      if (noiseAmount > 0) {
        if (!composer) {
          composer = new EffectComposer(renderer);
          composer.addPass(new RenderPass(scene, camera));
        }

        const noiseEffect = new Effect(
          "NoiseEffect",
          "uniform float uTime; uniform float uAmount; float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);} void mainUv(inout vec2 uv){} void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){ float n=hash(floor(uv*vec2(1920.0,1080.0))+floor(uTime*60.0)); float g=(n-0.5)*uAmount; outputColor=inputColor+vec4(vec3(g),0.0);} ",
          {
            uniforms: new Map<string, THREE.Uniform>([
              ["uAmount", new THREE.Uniform(noiseAmount)],
              ["uTime", new THREE.Uniform(0)],
            ]),
          }
        );

        const noisePass = new EffectPass(camera, noiseEffect);
        noisePass.renderToScreen = true;

        for (const pass of composer.passes) {
          pass.renderToScreen = false;
        }

        composer.addPass(noisePass);
      }

      composer?.setSize(renderer.domElement.width, renderer.domElement.height);

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
        const clickIndex = threeRef.current?.clickIndex ?? 0;
        const clickPoint = uniforms.uClickPos.value[clickIndex];

        if (!clickPoint) {
          return;
        }

        clickPoint.set(fx, fy);
        uniforms.uClickTimes.value[clickIndex] = uniforms.uTime.value;

        if (threeRef.current) {
          threeRef.current.clickIndex = (clickIndex + 1) % MAX_CLICKS;
        }
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (!touch) {
          return;
        }

        const { fx, fy, h, w } = mapToPixels(event);
        touch.addTouch({ x: fx / w, y: fy / h });
      };

      renderer.domElement.addEventListener("pointerdown", handlePointerDown, {
        passive: true,
      });
      renderer.domElement.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      const animate = () => {
        if (autoPauseOffscreen && !visibilityRef.current.visible) {
          const nextFrame = requestAnimationFrame(animate);

          if (threeRef.current) {
            threeRef.current.rafId = nextFrame;
          }

          return;
        }

        uniforms.uTime.value =
          timeOffset + clock.getElapsedTime() * speedRef.current;

        if (liquidEffect) {
          const timeUniform = liquidEffect.uniforms.get("uTime");

          if (timeUniform) {
            timeUniform.value = uniforms.uTime.value;
          }
        }

        if (composer) {
          touch?.update();

          for (const pass of composer.passes) {
            if (pass instanceof EffectPass) {
              syncPassTime(pass, uniforms.uTime.value);
            }
          }

          composer.render();
        } else {
          renderer.render(scene, camera);
        }

        const nextFrame = requestAnimationFrame(animate);

        if (threeRef.current) {
          threeRef.current.rafId = nextFrame;
        }
      };

      const rafId = requestAnimationFrame(animate);

      threeRef.current = {
        camera,
        clickIndex: 0,
        clock,
        composer,
        handlePointerDown,
        handlePointerMove,
        liquidEffect,
        material,
        quad,
        rafId,
        renderer,
        resizeObserver,
        scene,
        timeOffset,
        touch,
        uniforms,
      };
    } else if (threeRef.current) {
      const state = threeRef.current;
      state.uniforms.uShapeType.value = SHAPE_MAP[variant] ?? 0;
      state.uniforms.uPixelSize.value =
        pixelSize * state.renderer.getPixelRatio();
      state.uniforms.uColor.value.set(color);
      state.uniforms.uScale.value = patternScale;
      state.uniforms.uDensity.value = patternDensity;
      state.uniforms.uPixelJitter.value = pixelSizeJitter;
      state.uniforms.uEnableRipples.value = enableRipples ? 1 : 0;
      state.uniforms.uRippleIntensity.value = rippleIntensityScale;
      state.uniforms.uRippleThickness.value = rippleThickness;
      state.uniforms.uRippleSpeed.value = rippleSpeed;
      state.uniforms.uEdgeFade.value = edgeFade;

      if (transparent) {
        state.renderer.setClearAlpha(0);
      } else {
        state.renderer.setClearColor(0, 1);
      }

      if (state.liquidEffect) {
        const strengthUniform = state.liquidEffect.uniforms.get("uStrength");

        if (strengthUniform) {
          strengthUniform.value = liquidStrength;
        }

        const frequencyUniform = state.liquidEffect.uniforms.get("uFreq");

        if (frequencyUniform) {
          frequencyUniform.value = liquidWobbleSpeed;
        }
      }

      if (state.touch) {
        state.touch.radiusScale = liquidRadius;
      }
    }

    prevConfigRef.current = config;
  }, [
    antialias,
    autoPauseOffscreen,
    color,
    edgeFade,
    enableRipples,
    liquid,
    liquidRadius,
    liquidStrength,
    liquidWobbleSpeed,
    noiseAmount,
    patternDensity,
    patternScale,
    pixelSize,
    pixelSizeJitter,
    rippleIntensityScale,
    rippleSpeed,
    rippleThickness,
    speed,
    transparent,
    variant,
    containerRef,
  ]);

  useEffect(() => {
    const container = containerRef.current;

    return () => {
      if (!container) {
        return;
      }

      disposeState(container, threeRef.current);
      threeRef.current = null;
    };
  }, [containerRef]);
}
