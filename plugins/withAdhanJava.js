const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Config plugin to add adhan-java to android/app/build.gradle
 */
module.exports = function withAdhanJava(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            let contents = config.modResults.contents;

            const dependency = "implementation 'com.batoulapps.adhan:adhan:1.2.1'";
            const workManagerDependency = "implementation 'androidx.work:work-runtime-ktx:2.9.0'";

            // Check if already added
            if (!contents.includes(dependency) || !contents.includes(workManagerDependency)) {
                // Find dependencies block
                const depsRegex = /dependencies\s*\{/;
                if (depsRegex.test(contents)) {
                    // Remove old adhan dependency just in case it's there but workmanager isn't
                    contents = contents.replace(/\s*implementation\s+'com\.batoulapps\.adhan:adhan:1\.2\.1'/g, '');
                    contents = contents.replace(/\s*implementation\s+'androidx\.work:work-runtime-ktx:2\.9\.0'/g, '');

                    contents = contents.replace(
                        depsRegex,
                        `dependencies {\n    ${dependency}\n    ${workManagerDependency}`
                    );
                    console.log('✅ Added adhan-java dependency to build.gradle');
                } else {
                    console.warn('⚠️ Could not find dependencies block in build.gradle');
                }
            }

            config.modResults.contents = contents;
        } else {
            console.warn('⚠️ build.gradle is not groovy, cannot add adhan-java');
        }
        return config;
    });
};
