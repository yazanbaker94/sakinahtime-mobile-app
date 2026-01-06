const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin to copy Android widget files to the project
 */
module.exports = function withAndroidWidgets(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidProjectRoot = config.modRequest.platformProjectRoot;
      
      const sourceDir = path.join(projectRoot, 'native-modules', 'android');
      const javaTargetDir = path.join(androidProjectRoot, 'app', 'src', 'main', 'java', 'com', 'sakinahtime', 'app');
      const resTargetDir = path.join(androidProjectRoot, 'app', 'src', 'main', 'res');
      
      // Helper to copy directory recursively
      function copyDirRecursive(src, dest) {
        if (!fs.existsSync(src)) {
          console.warn(`⚠️ Source directory not found: ${src}`);
          return;
        }
        
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied ${entry.name}`);
          }
        }
      }
      
      // Copy widget Kotlin files
      const widgetDirs = ['widget', 'bridge'];
      for (const dir of widgetDirs) {
        const srcDir = path.join(sourceDir, dir);
        const destDir = path.join(javaTargetDir, dir);
        if (fs.existsSync(srcDir)) {
          copyDirRecursive(srcDir, destDir);
          console.log(`✅ Copied ${dir} directory`);
        }
      }
      
      // Copy resource files
      const resDirs = ['layout', 'xml', 'drawable', 'values'];
      for (const dir of resDirs) {
        const srcDir = path.join(sourceDir, 'res', dir);
        const destDir = path.join(resTargetDir, dir);
        
        if (fs.existsSync(srcDir)) {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          const files = fs.readdirSync(srcDir);
          for (const file of files) {
            // Only copy widget-related files
            if (file.startsWith('widget_')) {
              const srcPath = path.join(srcDir, file);
              const destPath = path.join(destDir, file);
              fs.copyFileSync(srcPath, destPath);
              console.log(`✅ Copied res/${dir}/${file}`);
            }
          }
        }
      }
      
      // Update strings.xml with widget strings
      const stringsPath = path.join(resTargetDir, 'values', 'strings.xml');
      if (fs.existsSync(stringsPath)) {
        let stringsContent = fs.readFileSync(stringsPath, 'utf8');
        
        const widgetStrings = `
  <!-- Widget Names -->
  <string name="widget_prayer_times_name">Prayer Times</string>
  <string name="widget_prayer_times_description">Shows daily prayer times for your location</string>
  <string name="widget_hijri_date_name">Hijri Date</string>
  <string name="widget_hijri_date_description">Shows the current Islamic date</string>
  <string name="widget_daily_verse_name">Daily Verse</string>
  <string name="widget_daily_verse_description">Shows a daily Quran verse</string>
  <string name="widget_tasbeeh_name">Tasbeeh Counter</string>
  <string name="widget_tasbeeh_description">A simple dhikr counter widget</string>
  
  <!-- Widget UI strings -->
  <string name="no_data">No data</string>
  <string name="open_app">Open app to setup</string>
  <string name="tap_to_refresh">Tap to refresh</string>
  <string name="prayer_times">Prayer Times</string>
  <string name="next_prayer">Next:</string>
  <string name="prayer_fajr">Fajr</string>
  <string name="prayer_dhuhr">Dhuhr</string>
  <string name="prayer_asr">Asr</string>
  <string name="prayer_maghrib">Maghrib</string>
  <string name="prayer_isha">Isha</string>
  <string name="verse_of_day">Verse of the Day</string>
  <string name="reset">Reset</string>`;
        
        // Check if widget strings already exist
        if (!stringsContent.includes('widget_prayer_times_name')) {
          // Insert before closing </resources> tag
          stringsContent = stringsContent.replace('</resources>', widgetStrings + '\n</resources>');
          fs.writeFileSync(stringsPath, stringsContent);
          console.log('✅ Added widget strings to strings.xml');
        }
      }
      
      // Update colors.xml with widget colors
      const colorsPath = path.join(resTargetDir, 'values', 'colors.xml');
      if (fs.existsSync(colorsPath)) {
        let colorsContent = fs.readFileSync(colorsPath, 'utf8');
        
        const widgetColors = `
  <!-- Widget Colors -->
  <color name="widget_background">#FFFFFF</color>
  <color name="widget_background_dark">#1F2937</color>
  <color name="widget_text_primary">#1F2937</color>
  <color name="widget_text_secondary">#6B7280</color>
  <color name="widget_accent">#10B981</color>
  <color name="widget_divider">#E5E7EB</color>
  <color name="widget_highlight">#F0FDF4</color>
  <color name="widget_highlight_bg">#F0FDF4</color>
  <color name="widget_tasbeeh_count">#10B981</color>
  <color name="widget_tasbeeh_target">#9CA3AF</color>
  <color name="widget_event_gold">#D4AF37</color>`;
        
        // Check if widget colors already exist
        if (!colorsContent.includes('widget_background')) {
          // Insert before closing </resources> tag
          colorsContent = colorsContent.replace('</resources>', widgetColors + '\n</resources>');
          fs.writeFileSync(colorsPath, colorsContent);
          console.log('✅ Added widget colors to colors.xml');
        }
      }
      
      return config;
    },
  ]);
};
