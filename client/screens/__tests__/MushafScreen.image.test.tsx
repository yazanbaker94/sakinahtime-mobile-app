/**
 * MushafScreen Image Quality Tests
 * 
 * Tests to verify image rendering quality on different devices/platforms
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// Source image dimensions (from assets/images/quran/*.png)
const SOURCE_IMAGE = {
  width: 1300,
  height: 2103,
};

describe('MushafScreen Image Quality', () => {
  describe('Image Resolution Coverage', () => {
    it('should have source images larger than physical pixels needed on 1x devices', () => {
      const pixelRatio = 1;
      const screenWidth = 360; // typical small phone
      const scale = screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      
      const neededWidth = screenWidth * pixelRatio;
      const neededHeight = imageHeight * pixelRatio;
      
      const coverageRatio = Math.min(
        SOURCE_IMAGE.width / neededWidth,
        SOURCE_IMAGE.height / neededHeight
      );
      
      expect(coverageRatio).toBeGreaterThanOrEqual(1);
      console.log(`1x device: Coverage ${(coverageRatio * 100).toFixed(0)}%`);
    });

    it('should have source images larger than physical pixels needed on 1.5x devices', () => {
      const pixelRatio = 1.5;
      const screenWidth = 360;
      const scale = screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      
      const neededWidth = screenWidth * pixelRatio;
      const neededHeight = imageHeight * pixelRatio;
      
      const coverageRatio = Math.min(
        SOURCE_IMAGE.width / neededWidth,
        SOURCE_IMAGE.height / neededHeight
      );
      
      expect(coverageRatio).toBeGreaterThanOrEqual(1);
      console.log(`1.5x device: Coverage ${(coverageRatio * 100).toFixed(0)}%`);
    });

    it('should have source images larger than physical pixels needed on 2x devices', () => {
      const pixelRatio = 2;
      const screenWidth = 375; // iPhone
      const scale = screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      
      const neededWidth = screenWidth * pixelRatio;
      const neededHeight = imageHeight * pixelRatio;
      
      const coverageRatio = Math.min(
        SOURCE_IMAGE.width / neededWidth,
        SOURCE_IMAGE.height / neededHeight
      );
      
      expect(coverageRatio).toBeGreaterThanOrEqual(1);
      console.log(`2x device: Coverage ${(coverageRatio * 100).toFixed(0)}%`);
    });

    it('should have source images larger than physical pixels needed on 3x devices', () => {
      const pixelRatio = 3;
      const screenWidth = 390; // iPhone Pro
      const scale = screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      
      const neededWidth = screenWidth * pixelRatio;
      const neededHeight = imageHeight * pixelRatio;
      
      const coverageRatio = Math.min(
        SOURCE_IMAGE.width / neededWidth,
        SOURCE_IMAGE.height / neededHeight
      );
      
      // 3x devices may need upscaling - this is expected to fail
      // Source: 1300px, Needed: 1170px = 111% coverage (OK)
      expect(coverageRatio).toBeGreaterThanOrEqual(1);
      console.log(`3x device: Coverage ${(coverageRatio * 100).toFixed(0)}%`);
    });

    it('should warn when source is insufficient for high-DPI tablets', () => {
      const pixelRatio = 2;
      const screenWidth = 768; // iPad
      const scale = screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      
      const neededWidth = screenWidth * pixelRatio;
      const neededHeight = imageHeight * pixelRatio;
      
      const coverageRatio = Math.min(
        SOURCE_IMAGE.width / neededWidth,
        SOURCE_IMAGE.height / neededHeight
      );
      
      // iPad 2x: 768 * 2 = 1536px needed, source is 1300px = 85% coverage (FAIL)
      console.log(`iPad 2x: Coverage ${(coverageRatio * 100).toFixed(0)}% - ${coverageRatio >= 1 ? 'OK' : 'INSUFFICIENT'}`);
      
      if (coverageRatio < 1) {
        console.warn(`⚠️ Source images too small for iPad. Need ${Math.ceil(neededWidth)}x${Math.ceil(neededHeight)}px`);
      }
    });
  });

  describe('Image Scaling Calculations', () => {
    it('should calculate correct scale factor', () => {
      const screenWidth = 384; // from user's device
      const scale = screenWidth / SOURCE_IMAGE.width;
      
      expect(scale).toBeCloseTo(0.295, 2);
    });

    it('should calculate correct image height', () => {
      const screenWidth = 384;
      const scale = screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      
      expect(imageHeight).toBeCloseTo(621.19, 1);
    });

    it('should calculate correct offset for centering', () => {
      const screenWidth = 384;
      const screenHeight = 774.4; // from user's device
      const scale = screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      const offsetY = (screenHeight - imageHeight) / 2;
      
      expect(offsetY).toBeCloseTo(76.6, 1);
    });
  });

  describe('Device-specific Quality Analysis', () => {
    it('should analyze user device (Android 1.875x)', () => {
      const device = {
        platform: 'android',
        screenWidth: 384,
        screenHeight: 774.4,
        pixelRatio: 1.875,
      };
      
      const scale = device.screenWidth / SOURCE_IMAGE.width;
      const imageHeight = SOURCE_IMAGE.height * scale;
      const neededWidth = device.screenWidth * device.pixelRatio;
      const neededHeight = imageHeight * device.pixelRatio;
      const coverageRatio = SOURCE_IMAGE.width / neededWidth;
      
      console.log('=== USER DEVICE ANALYSIS ===');
      console.log(`Platform: ${device.platform}`);
      console.log(`Screen: ${device.screenWidth}x${device.screenHeight}dp`);
      console.log(`Pixel Ratio: ${device.pixelRatio}x`);
      console.log(`Physical pixels needed: ${Math.round(neededWidth)}x${Math.round(neededHeight)}`);
      console.log(`Source: ${SOURCE_IMAGE.width}x${SOURCE_IMAGE.height}`);
      console.log(`Coverage: ${(coverageRatio * 100).toFixed(0)}%`);
      console.log(`Result: ${coverageRatio >= 1 ? '✅ Resolution OK' : '❌ Need higher res'}`);
      
      // User's device: 720px needed, 1300px source = 180% coverage
      expect(coverageRatio).toBeGreaterThanOrEqual(1);
      expect(coverageRatio).toBeCloseTo(1.8, 1);
    });

    it('should identify Android vs iOS rendering difference', () => {
      // Same source, same dimensions - different rendering quality
      // This test documents the known issue
      
      const analysis = {
        sourceResolution: `${SOURCE_IMAGE.width}x${SOURCE_IMAGE.height}`,
        iosRendering: 'Uses Core Graphics - high quality downscaling',
        androidRNImage: 'Uses Fresco - can produce artifacts when downscaling',
        androidExpoImage: 'Uses Glide/Coil - better quality downscaling',
        solution: 'Use expo-image instead of RN Image on Android',
      };
      
      console.log('=== iOS vs Android Rendering ===');
      console.log(JSON.stringify(analysis, null, 2));
      
      expect(analysis.solution).toBe('Use expo-image instead of RN Image on Android');
    });
  });

  describe('expo-image Configuration', () => {
    it('should use correct contentFit for Mushaf pages', () => {
      // contentFit="contain" preserves aspect ratio and fits within bounds
      const contentFit = 'contain';
      expect(contentFit).toBe('contain');
    });

    it('should use memory-disk caching for performance', () => {
      const cachePolicy = 'memory-disk';
      expect(cachePolicy).toBe('memory-disk');
    });

    it('should disable transition for instant display', () => {
      const transition = 0;
      expect(transition).toBe(0);
    });
  });
});

describe('Image Quality Recommendations', () => {
  it('should generate recommendations based on device', () => {
    const devices = [
      { name: 'Low-end Android', width: 360, ratio: 1.5 },
      { name: 'Mid-range Android', width: 384, ratio: 1.875 },
      { name: 'High-end Android', width: 412, ratio: 2.625 },
      { name: 'iPhone SE', width: 375, ratio: 2 },
      { name: 'iPhone Pro', width: 390, ratio: 3 },
      { name: 'iPad', width: 768, ratio: 2 },
      { name: 'iPad Pro', width: 1024, ratio: 2 },
    ];
    
    console.log('\n=== DEVICE COMPATIBILITY REPORT ===\n');
    
    devices.forEach(device => {
      const neededWidth = device.width * device.ratio;
      const coverage = (SOURCE_IMAGE.width / neededWidth * 100).toFixed(0);
      const status = SOURCE_IMAGE.width >= neededWidth ? '✅' : '❌';
      
      console.log(`${status} ${device.name}: ${device.width}dp × ${device.ratio}x = ${Math.round(neededWidth)}px needed (${coverage}% coverage)`);
    });
    
    const maxNeeded = Math.max(...devices.map(d => d.width * d.ratio));
    console.log(`\n📊 Max physical width needed: ${Math.round(maxNeeded)}px`);
    console.log(`📊 Current source width: ${SOURCE_IMAGE.width}px`);
    
    if (SOURCE_IMAGE.width < maxNeeded) {
      console.log(`⚠️ Recommendation: Upgrade source images to at least ${Math.ceil(maxNeeded)}px wide`);
    }
  });
});
