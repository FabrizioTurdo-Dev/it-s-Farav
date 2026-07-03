import * as THREE from 'three';

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 600;
    this.sparkCount = 40;

    this._createDustParticles();
    this._createSparks();
  }

  _createDustParticles() {
    const positions = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const opacities = new Float32Array(this.particleCount);
    const speeds = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 5;

      sizes[i] = Math.random() * 3 + 0.5;
      opacities[i] = Math.random() * 0.3 + 0.05;
      speeds[i] = Math.random() * 0.3 + 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        attribute float aOpacity;
        attribute float aSpeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vOpacity;

        void main() {
          vec3 pos = position;

          // Extremely slow floating movement
          pos.y += sin(uTime * aSpeed * 0.15 + position.x * 0.5) * 1.5;
          pos.x += cos(uTime * aSpeed * 0.1 + position.y * 0.3) * 0.8;
          pos.z += sin(uTime * aSpeed * 0.05) * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);

          vOpacity = aOpacity;
        }
      `,
      fragmentShader: `
        varying float vOpacity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
          // Steel gray with very subtle warm tint
          vec3 color = vec3(0.25, 0.23, 0.22);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
    });

    this.dustMesh = new THREE.Points(geometry, material);
    this.scene.add(this.dustMesh);
  }

  _createSparks() {
    const positions = new Float32Array(this.sparkCount * 3);
    const sizes = new Float32Array(this.sparkCount);
    const lifetimes = new Float32Array(this.sparkCount);
    const phases = new Float32Array(this.sparkCount);

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;

      sizes[i] = Math.random() * 2 + 1;
      lifetimes[i] = Math.random() * 5 + 3;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float aSize;
        attribute float aLifetime;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Cycle through life
          float life = mod(uTime + aPhase, aLifetime) / aLifetime;

          // Fade in and out
          vAlpha = sin(life * 3.14159) * 0.6;

          // Slight upward drift
          pos.y += life * 3.0;
          pos.x += sin(uTime * 0.5 + aPhase) * 0.5;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float glow = smoothstep(0.5, 0.0, dist);
          // Warm orange-red spark color
          vec3 color = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.6, 0.2), glow);
          gl_FragColor = vec4(color, glow * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
    });

    this.sparkMesh = new THREE.Points(geometry, material);
    this.scene.add(this.sparkMesh);
  }

  update(elapsed, delta, mouse) {
    // Update dust
    this.dustMesh.material.uniforms.uTime.value = elapsed;

    // Update sparks
    this.sparkMesh.material.uniforms.uTime.value = elapsed;

    // Very subtle reaction to mouse — particles drift away slightly
    const dustPositions = this.dustMesh.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const dx = mouse.x * 0.5;
      const dy = mouse.y * 0.3;
      dustPositions[i * 3] += dx * 0.001;
      dustPositions[i * 3 + 1] += dy * 0.001;
    }
    this.dustMesh.geometry.attributes.position.needsUpdate = true;
  }
}
