/**
 * materials.js — the shading language of the 3D stage.
 *
 * One instanced shader draws nodes, bars, tiles, blocks, tubes and arrows.
 * It does its own three-point lighting (warm key, cool fill, hemisphere
 * ambient), a tight specular, a state-tinted fresnel rim and a restrained
 * emissive term, then tone-maps (ACES fit) and encodes to sRGB in-shader.
 *
 * Deliberately gone from the old shader: the global "breathe" pulse that made
 * every object throb, emissive gains hot enough to need bloom, and a white
 * rim that flattened silhouettes. Objects now read as lit solids, so the
 * post-processing stack (bloom / chromatic aberration / noise) is unnecessary.
 */
import * as THREE from 'three'

const ELEMENT_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aGlow;
  attribute float aFade;

  varying vec3  vColor;
  varying float vGlow;
  varying float vFade;
  varying vec3  vN;
  varying vec3  vV;
  varying float vDepth;

  void main() {
    vColor = aColor;
    vGlow  = aGlow;
    vFade  = aFade;

    vec4 world = instanceMatrix * vec4(position, 1.0);
    vec4 mv    = modelViewMatrix * world;

    vN     = normalize(normalMatrix * (mat3(instanceMatrix) * normal));
    vV     = normalize(-mv.xyz);
    vDepth = -mv.z;

    gl_Position = projectionMatrix * mv;
  }
`

const ELEMENT_FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uKeyDir;
  uniform vec3  uFillDir;
  uniform vec3  uSkyTint;
  uniform vec3  uGroundTint;
  uniform float uFadeNear;
  uniform float uFadeFar;

  varying vec3  vColor;
  varying float vGlow;
  varying float vFade;
  varying vec3  vN;
  varying vec3  vV;
  varying float vDepth;

  vec3 aces(vec3 x) {
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }
  vec3 toSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(max(c, vec3(1e-5)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  }

  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    vec3 base = vColor;

    vec3 key  = normalize(uKeyDir);
    vec3 fill = normalize(uFillDir);

    float kd = max(dot(n, key), 0.0);
    float fd = max(dot(n, fill), 0.0);
    float hemi = 0.5 + 0.5 * n.y;

    /* diffuse: one warm key, one cool low fill, hemisphere ambient */
    vec3 lit = base * (0.58 * kd)
             + base * (0.15 * fd)
             + mix(uGroundTint, uSkyTint, hemi) * base * 0.34;

    /* tight specular — a material hint, not a highlight parade */
    vec3 h = normalize(key + v);
    float spec = pow(max(dot(n, h), 0.0), 72.0) * 0.28;

    /* fresnel rim tinted by the object's own state colour */
    float fr = pow(1.0 - max(dot(n, v), 0.0), 3.2);
    vec3 rim = mix(vec3(0.85, 0.82, 0.74), base, 0.6) * fr * (0.10 + vGlow * 0.34);

    /* emissive: state heat, kept below clipping so no bloom is needed */
    vec3 emis = base * (vGlow * 0.42);

    vec3 col = lit + emis + rim + vec3(1.0, 0.98, 0.93) * spec * (0.35 + vGlow * 0.3);

    /* distance fade into the void */
    float dist = 1.0 - smoothstep(uFadeNear, uFadeFar, vDepth);
    col *= mix(0.3, 1.0, dist);

    col = aces(col * 1.06);
    col = toSrgb(col) * vFade;

    gl_FragColor = vec4(col, 1.0);
  }
`

export function createElementMaterial({ fadeNear = 52, fadeFar = 150 } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: ELEMENT_VERT,
    fragmentShader: ELEMENT_FRAG,
    uniforms: {
      uKeyDir: { value: new THREE.Vector3(0.42, 0.92, 0.52) },
      uFillDir: { value: new THREE.Vector3(-0.62, 0.16, -0.38) },
      uSkyTint: { value: new THREE.Color('#ded0bb') },
      uGroundTint: { value: new THREE.Color('#34252a') },
      uFadeNear: { value: fadeNear },
      uFadeFar: { value: fadeFar },
    },
    toneMapped: false,
  })
}

const GROUND_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const GROUND_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uLine;
  uniform float uCell;
  varying vec3 vWorld;

  float grid(vec2 p, float cell, float w) {
    vec2 g = abs(fract(p / cell - 0.5) - 0.5) / fwidth(p / cell);
    float l = min(g.x, g.y);
    return 1.0 - smoothstep(0.0, w, l);
  }

  void main() {
    vec2 p = vWorld.xz;
    float d = length(p);

    float fine  = grid(p, uCell, 1.0);
    float major = grid(p, uCell * 5.0, 1.1);

    float fade = 1.0 - smoothstep(14.0, 58.0, d);
    vec3 col = uLine * (fine * 0.10 + major * 0.22) * fade;

    /* dissolve well before the plane edge */
    col *= 1.0 - smoothstep(46.0, 150.0, d);

    gl_FragColor = vec4(col, 1.0);
  }
`

export function createGroundMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: GROUND_VERT,
    fragmentShader: GROUND_FRAG,
    uniforms: {
      uLine: { value: new THREE.Color('#594149') },
      uCell: { value: 2.0 },
    },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })
}
