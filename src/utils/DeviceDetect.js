export class DeviceDetect {
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  static isLowPerformance() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return true;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const lowEnd = ['SwiftShader', 'Intel', 'Mesa', 'llvmpipe', 'Adreno 3', 'Adreno 4', 'PowerVR SGX', 'Mali-4', 'Mali-T'];
      if (lowEnd.some(s => renderer.includes(s))) return true;
    }

    if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;

    return false;
  }

  static isMinimal() {
    if (navigator.deviceMemory && navigator.deviceMemory < 2) return true;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const veryLow = ['SwiftShader', 'llvmpipe', 'Mesa', 'Software'];
        if (veryLow.some(s => renderer.includes(s))) return true;
      }
    }

    return false;
  }

  static getPerformanceTier() {
    if (this.isMinimal()) return 'minimal';
    if (this.isMobile()) return 'mobile';
    if (this.isLowPerformance()) return 'low';
    return 'high';
  }

  static getParticleCount(tier) {
    switch (tier) {
      case 'high': return 600;
      case 'low': return 200;
      case 'mobile': return 150;
      case 'minimal': return 0;
      default: return 400;
    }
  }

  static getSparkCount(tier) {
    switch (tier) {
      case 'high': return 40;
      case 'low': return 15;
      case 'mobile': return 10;
      case 'minimal': return 0;
      default: return 20;
    }
  }

  static shouldUseVolumetricFog(tier) {
    return tier === 'high';
  }

  static shouldUseGlowBeam(tier) {
    return tier === 'high';
  }

  static shouldUseLights(tier) {
    return tier === 'high';
  }

  static getFogOctaves(tier) {
    switch (tier) {
      case 'high': return 5;
      case 'low': return 2;
      case 'mobile': return 2;
      case 'minimal': return 1;
      default: return 3;
    }
  }

  static getFogLayers(tier) {
    switch (tier) {
      case 'high': return 2;
      case 'low': return 1;
      case 'mobile': return 1;
      case 'minimal': return 0;
      default: return 1;
    }
  }
}
