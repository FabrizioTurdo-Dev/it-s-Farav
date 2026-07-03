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
      // Common low-end GPU strings
      const lowEnd = ['SwiftShader', 'Intel', 'Mesa', 'llvmpipe'];
      if (lowEnd.some(s => renderer.includes(s))) return true;
    }

    // Check device memory (Chrome only)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;

    return false;
  }

  static getPerformanceTier() {
    if (this.isMobile()) return 'mobile';
    if (this.isLowPerformance()) return 'low';
    return 'high';
  }

  static getParticleCount(tier) {
    switch (tier) {
      case 'high': return 600;
      case 'low': return 200;
      case 'mobile': return 150;
      default: return 400;
    }
  }

  static shouldUseVolumetricFog(tier) {
    return tier === 'high';
  }
}
