import * as THREE from 'three';

const beaconVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const beaconFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uRotationSpeed;
  uniform vec2 uMouse;
  uniform float uScrollProgress;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  #define PI 3.14159265359

  void main() {
    vec2 uv = vUv;

    // Beacon rotation angle
    float angle = uTime * uRotationSpeed;

    // Add mouse influence to rotation (subtle ±15 degrees)
    float mouseOffset = uMouse.x * 0.26;
    angle += mouseOffset;

    // Create the cone of light
    // The beam sweeps across horizontally
    float beamWidth = 0.08;
    float beamSoftness = 0.04;

    // Calculate angle from center of sweep
    float sweepAngle = atan(uv.x - 0.5, 1.0) - angle;
    sweepAngle = mod(sweepAngle + PI, PI * 2.0) - PI;

    // Beam intensity — sharp core with soft falloff
    float beam = smoothstep(beamWidth + beamSoftness, beamWidth, abs(sweepAngle));

    // Vertical falloff — beam is stronger in the middle vertically
    float verticalFalloff = 1.0 - abs(uv.y - 0.5) * 1.5;
    verticalFalloff = clamp(verticalFalloff, 0.0, 1.0);

    // Distance attenuation — beam fades with distance from source
    float dist = length(uv - vec2(0.5, 0.1));
    float attenuation = 1.0 / (1.0 + dist * 3.0);

    // Intensity pulsation
    float pulse = sin(uTime * 0.3) * 0.15 + 0.85;
    float finalIntensity = beam * verticalFalloff * attenuation * pulse * uIntensity;

    // Scroll modulation — beam intensifies at certain scroll positions
    float scrollMod = 1.0 + uScrollProgress * 0.3;
    finalIntensity *= scrollMod;

    // Core beam color — deep red
    vec3 beamColor = vec3(0.82, 0.0, 0.0);

    // Brighter core
    vec3 coreColor = vec3(1.0, 0.15, 0.05);
    beamColor = mix(beamColor, coreColor, beam * 0.5);

    // Volumetric scatter — slight glow around beam
    float scatter = smoothstep(0.3, 0.0, abs(sweepAngle)) * 0.3;
    finalIntensity += scatter * verticalFalloff * attenuation * pulse * uIntensity * 0.5;

    // Output
    vec3 finalColor = beamColor * finalIntensity;
    float alpha = finalIntensity * 0.7;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Secondary beam — wider, dimmer, for volumetric feel
const glowFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uRotationSpeed;
  uniform vec2 uMouse;
  varying vec2 vUv;

  #define PI 3.14159265359

  void main() {
    float angle = uTime * uRotationSpeed + uMouse.x * 0.26;

    float sweepAngle = atan(vUv.x - 0.5, 1.0) - angle;
    sweepAngle = mod(sweepAngle + PI, PI * 2.0) - PI;

    // Much wider, softer beam
    float beam = smoothstep(0.4, 0.1, abs(sweepAngle));
    float verticalFalloff = 1.0 - abs(vUv.y - 0.5) * 1.2;
    verticalFalloff = clamp(verticalFalloff, 0.0, 1.0);

    float dist = length(vUv - vec2(0.5, 0.1));
    float attenuation = 1.0 / (1.0 + dist * 2.0);

    float pulse = sin(uTime * 0.3) * 0.15 + 0.85;
    float finalIntensity = beam * verticalFalloff * attenuation * pulse * uIntensity * 0.4;

    vec3 glowColor = vec3(0.5, 0.02, 0.02);
    vec3 finalColor = glowColor * finalIntensity;
    float alpha = finalIntensity * 0.3;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export class Beacon {
  constructor(scene) {
    this.scene = scene;

    const geometry = new THREE.PlaneGeometry(100, 50, 1, 1);

    // Main beam
    this.beamMaterial = new THREE.ShaderMaterial({
      vertexShader: beaconVertexShader,
      fragmentShader: beaconFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uRotationSpeed: { value: 0.15 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uScrollProgress: { value: 0 },
      },
    });

    this.beamMesh = new THREE.Mesh(geometry, this.beamMaterial);
    this.beamMesh.position.set(0, 5, -10);
    this.scene.add(this.beamMesh);

    // Glow beam (wider, dimmer)
    this.glowMaterial = new THREE.ShaderMaterial({
      vertexShader: beaconVertexShader,
      fragmentShader: glowFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 1.0 },
        uRotationSpeed: { value: 0.15 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
    });

    this.glowMesh = new THREE.Mesh(geometry.clone(), this.glowMaterial);
    this.glowMesh.position.set(0, 5, -12);
    this.scene.add(this.glowMesh);

    // Central beacon point light (red)
    this.pointLight = new THREE.PointLight(0xD10000, 2, 50, 2);
    this.pointLight.position.set(0, 5, -5);
    this.scene.add(this.pointLight);

    // Ambient dim light
    this.ambientLight = new THREE.AmbientLight(0x111111, 0.5);
    this.scene.add(this.ambientLight);
  }

  update(elapsed, delta, mouse, scrollProgress = 0) {
    // Update beam uniforms
    this.beamMaterial.uniforms.uTime.value = elapsed;
    this.beamMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
    this.beamMaterial.uniforms.uScrollProgress.value = scrollProgress;

    // Update glow uniforms
    this.glowMaterial.uniforms.uTime.value = elapsed;
    this.glowMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Point light follows beam rotation loosely
    const beamAngle = elapsed * 0.15 + mouse.x * 0.26;
    this.pointLight.position.x = Math.sin(beamAngle) * 8;
    this.pointLight.position.z = -5 + Math.cos(beamAngle) * 5;

    // Intensity pulsation
    const pulse = Math.sin(elapsed * 0.3) * 0.3 + 1.0;
    this.pointLight.intensity = pulse * 1.5;
  }

  setIntensity(value) {
    this.beamMaterial.uniforms.uIntensity.value = value;
    this.glowMaterial.uniforms.uIntensity.value = value;
  }

  setRotationSpeed(speed) {
    this.beamMaterial.uniforms.uRotationSpeed.value = speed;
    this.glowMaterial.uniforms.uRotationSpeed.value = speed;
  }
}
