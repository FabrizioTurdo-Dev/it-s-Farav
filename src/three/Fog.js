import * as THREE from 'three';

const fogVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fogFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uMouse;
  uniform float uScrollProgress;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;

    // Multiple layers of fog moving at different speeds
    float slowTime = uTime * 0.03;
    float medTime = uTime * 0.06;

    vec3 pos1 = vec3(uv * 3.0, slowTime);
    vec3 pos2 = vec3(uv * 5.0 + 100.0, medTime);
    vec3 pos3 = vec3(uv * 8.0 + 200.0, slowTime * 1.5);

    float fog1 = fbm(pos1) * 0.5 + 0.5;
    float fog2 = fbm(pos2) * 0.5 + 0.5;
    float fog3 = fbm(pos3) * 0.5 + 0.5;

    float combinedFog = fog1 * 0.5 + fog2 * 0.3 + fog3 * 0.2;

    // Mouse influence — subtle brightening near cursor
    float mouseDist = length(uv - (uMouse * 0.5 + 0.5));
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.15;

    // Scroll-based intensity shift
    float scrollFade = 1.0 - uScrollProgress * 0.3;

    // Color: dark grays with very subtle red tint
    vec3 fogColor = vec3(0.03, 0.03, 0.035);
    vec3 redTint = vec3(0.08, 0.01, 0.01);
    vec3 finalColor = mix(fogColor, redTint, combinedFog * 0.3 + mouseInfluence);

    float alpha = combinedFog * uIntensity * scrollFade * 0.6;
    alpha += mouseInfluence;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export class Fog {
  constructor(scene) {
    this.scene = scene;

    const geometry = new THREE.PlaneGeometry(120, 80, 1, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader: fogVertexShader,
      fragmentShader: fogFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uScrollProgress: { value: 0 },
      },
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = -15;
    this.mesh.position.y = 0;
    scene.add(this.mesh);

    // Second fog layer — offset and rotated for depth
    this.mesh2 = this.mesh.clone();
    this.mesh2.material = this.material.clone();
    this.mesh2.position.z = -25;
    this.mesh2.position.y = 5;
    this.mesh2.rotation.z = 0.3;
    scene.add(this.mesh2);
  }

  update(elapsed, delta, mouse, scrollProgress = 0) {
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uMouse.value.set(mouse.x, mouse.y);
    this.material.uniforms.uScrollProgress.value = scrollProgress;

    this.mesh2.material.uniforms.uTime.value = elapsed;
    this.mesh2.material.uniforms.uMouse.value.set(mouse.x, mouse.y);
    this.mesh2.material.uniforms.uScrollProgress.value = scrollProgress;

    // Extremely slow movement
    this.mesh.position.x = Math.sin(elapsed * 0.01) * 2;
    this.mesh2.position.x = Math.cos(elapsed * 0.008) * 3;
  }

  setIntensity(value) {
    this.material.uniforms.uIntensity.value = value;
    this.mesh2.material.uniforms.uIntensity.value = value;
  }
}
