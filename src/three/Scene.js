import * as THREE from 'three';

export class Scene {
  constructor() {
    this.canvas = document.getElementById('beacon-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x050505, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 30);

    this.clock = new THREE.Clock();
    this.mixers = [];
    this.callbacks = [];

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this._onMouseMove = this._onMouseMove.bind(this);
    window.addEventListener('mousemove', this._onMouseMove);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  add(object) {
    this.scene.add(object);
  }

  onUpdate(callback) {
    this.callbacks.push(callback);
  }

  start() {
    this._animate();
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Smooth mouse interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Update camera subtly based on mouse
    this.camera.position.x = this.mouse.x * 2;
    this.camera.position.y = this.mouse.y * 1;
    this.camera.lookAt(0, 0, 0);

    // Run all registered update callbacks
    for (const cb of this.callbacks) {
      cb(elapsed, delta, this.mouse);
    }

    // Update animation mixers
    for (const mixer of this.mixers) {
      mixer.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onMouseMove);
    this.renderer.dispose();
  }
}
