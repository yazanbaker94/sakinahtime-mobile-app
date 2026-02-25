const { withAndroidManifest } = require('@expo/config-plugins');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');

/**
 * Config plugin to exclude quran-pages/ from Android Auto-Backup.
 * 
 * Without this, Android backs up ~68 MB of downloaded Quran images
 * to the user's Google Drive quota on every backup cycle.
 * 
 * Creates res/xml/backup_rules.xml and res/xml/data_extraction_rules.xml,
 * then wires them into the <application> tag in AndroidManifest.xml.
 */
module.exports = function withBackupRules(config) {
    return withAndroidManifest(config, async (config) => {
        const { manifest } = config.modResults;
        const application = manifest.application[0];

        // Path to res/xml/
        const resXmlDir = join(
            config.modRequest.platformProjectRoot,
            'app', 'src', 'main', 'res', 'xml'
        );
        if (!existsSync(resXmlDir)) {
            mkdirSync(resXmlDir, { recursive: true });
        }

        // === Android 11 and below: fullBackupContent ===
        const backupRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <!-- Exclude downloaded Quran page images (68 MB) from cloud backup -->
    <exclude domain="file" path="quran-pages" />
</full-backup-content>
`;
        writeFileSync(join(resXmlDir, 'backup_rules.xml'), backupRules);
        console.log('✅ Created res/xml/backup_rules.xml');

        // === Android 12+: dataExtractionRules ===
        const dataExtractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <!-- Exclude downloaded Quran page images (68 MB) from cloud backup -->
        <exclude domain="file" path="quran-pages" />
    </cloud-backup>
    <device-transfer>
        <!-- Allow quran-pages during device-to-device transfer (fast, no quota) -->
        <include domain="file" path="quran-pages" />
    </device-transfer>
</data-extraction-rules>
`;
        writeFileSync(join(resXmlDir, 'data_extraction_rules.xml'), dataExtractionRules);
        console.log('✅ Created res/xml/data_extraction_rules.xml');

        // Wire into AndroidManifest <application> tag
        application.$['android:fullBackupContent'] = '@xml/backup_rules';
        application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
        console.log('✅ Added backup rules to AndroidManifest.xml');

        return config;
    });
};
