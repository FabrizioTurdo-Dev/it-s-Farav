import { Scene } from './three/Scene.js';
import { Fog } from './three/Fog.js';
import { Particles } from './three/Particles.js';
import { Beacon } from './three/Beacon.js';
import { DeviceDetect } from './utils/DeviceDetect.js';

export class ManifiestoBg {
  constructor() {
    this.tier = DeviceDetect.getPerformanceTier();
    this.scene = new Scene(this.tier);
    this.beacon = new Beacon(this.scene.scene, this.tier);
    this.fog = new Fog(this.scene.scene, this.tier);
    this.particles = new Particles(this.scene.scene, this.tier);

    this.scene.start();

    this.scene.onUpdate((elapsed, delta, mouse) => {
      this.fog.update(elapsed, delta, mouse, 0);
      this.particles.update(elapsed, delta, mouse);
      this.beacon.update(elapsed, delta, mouse, 0);
    });
  }
}
