import * as THREE from 'three';
import { DeviceDetect } from '../utils/DeviceDetect.js';

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
    float angle = uTime * uRotationSpeed;
    float mouseOffset = uMouse.x * 0.26;
    angle += mouseOffset;
    float beamWidth = 0.08;
    float beamSoftness = 0.04;
    float sweepAngle = atan(uv.x - 0.5, 1.0) - angle;
    sweepAngle = mod(sweepAngle + PI, PI * 2.0) - PI;
    float beam = smoothstep(beamWidth + beamSoftness, beamWidth, abs(sweepAngle));
    float verticalFalloff = 1.0 - abs(uv.y - 0.5) * 1.5;
    verticalFalloff = clamp(verticalFalloff, 0.0, 1.0);
    float dist = length(uv - vec2(0.5, 0.1));
    float attenuation = 1.0 / (1.0 + dist * 3.0);
    float pulse = sin(uTime * 0.3) * 0.15 + 0.85;
    float finalIntensity = beam * verticalFalloff * attenuation * pulse * uIntensity;
    float scrollMod = 1.0 + uScrollProgress * 0.3;
    finalIntensity *= scrollMod;
    vec3 beamColor = vec3(0.82, 0.0, 0.0);
    vec3 coreColor = vec3(1.0, 0.15, 0.05);
    beamColor = mix(beamColor, coreColor, beam * 0.5);
    float scatter = smoothstep(0.3, 0.0, abs(sweepAngle)) * 0.3;
    finalIntensity += scatter * verticalFalloff * attenuation * pulse * uIntensity * 0.5;
    vec3 finalColor = beamColor * finalIntensity;
    float alpha = finalIntensity * 0.7;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

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
  constructor(scene, tier = 'high') {
    this.scene = scene;
    this.tier = tier;
    this.useGlow = DeviceDetect.shouldUseGlowBeam(tier);
    this.useLights = DeviceDetect.shouldUseLights(tier);

    const geometry = new THREE.PlaneGeometry(100, 50, 1, 1);
    const isLow = tier !== 'high';

    this.beamMaterial = new THREE.ShaderMaterial({
      vertexShader: beaconVertexShader,
      fragmentShader: beaconFragmentShader,
      transparent: true,
      depthWrite: false,
      side: isLow ? THREE.FrontSide : THREE.DoubleSide,
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

    if (this.useGlow) {
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
    } else {
      this.glowMaterial = null;
      this.glowMesh = null;
    }

    if (this.useLights) {
      this.pointLight = new THREE.PointLight(0xD10000, 2, 50, 2);
      this.pointLight.position.set(0, 5, -5);
      this.scene.add(this.pointLight);

      this.ambientLight = new THREE.AmbientLight(0x111111, 0.5);
      this.scene.add(this.ambientLight);
    } else {
      this.pointLight = null;
      this.ambientLight = null;
    }
  }

  update(elapsed, delta, mouse, scrollProgress = 0) {
    this.beamMaterial.uniforms.uTime.value = elapsed;
    this.beamMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
    this.beamMaterial.uniforms.uScrollProgress.value = scrollProgress;

    if (this.glowMaterial) {
      this.glowMaterial.uniforms.uTime.value = elapsed;
      this.glowMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
    }

    if (this.pointLight) {
      const beamAngle = elapsed * 0.15 + mouse.x * 0.26;
      this.pointLight.position.x = Math.sin(beamAngle) * 8;
      this.pointLight.position.z = -5 + Math.cos(beamAngle) * 5;
      const pulse = Math.sin(elapsed * 0.3) * 0.3 + 1.0;
      this.pointLight.intensity = pulse * 1.5;
    }
  }

  setIntensity(value) {
    this.beamMaterial.uniforms.uIntensity.value = value;
    if (this.glowMaterial) {
      this.glowMaterial.uniforms.uIntensity.value = value;
    }
  }

  setRotationSpeed(speed) {
    this.beamMaterial.uniforms.uRotationSpeed.value = speed;
    if (this.glowMaterial) {
      this.glowMaterial.uniforms.uRotationSpeed.value = speed;
    }
  }
}
