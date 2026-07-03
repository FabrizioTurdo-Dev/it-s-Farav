import { Scene } from './three/Scene.js';
import { Fog } from './three/Fog.js';
import { Particles } from './three/Particles.js';
import { Beacon } from './three/Beacon.js';

export class ManifiestoBg {
  constructor() {
    this.scene = new Scene();
    this.beacon = new Beacon(this.scene.scene);
    this.fog = new Fog(this.scene.scene);
    this.particles = new Particles(this.scene.scene);

    this.scene.start();

    this.scene.onUpdate((elapsed, delta, mouse) => {
      this.fog.update(elapsed, delta, mouse, 0);
      this.particles.update(elapsed, delta, mouse);
      this.beacon.update(elapsed, delta, mouse, 0);
    });
  }
}
