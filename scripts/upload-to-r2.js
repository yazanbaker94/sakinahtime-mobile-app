/**
 * Upload Quran page images to Cloudflare R2 using wrangler CLI
 * 
 * Usage: node scripts/upload-to-r2.js
 * 
 * Reads credentials from .env.r2
 * Extracts quran-pages-v1.zip and uploads 604 individual pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ZIP_PATH = path.join(ROOT, 'quran-pages-v1.zip');
const EXTRACT_DIR = path.join(ROOT, 'temp-quran-extract');
const BUCKET = 'sakinahtime-mobile-app';

// Read .env.r2
const envFile = fs.readFileSync(path.join(ROOT, '.env.r2'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
});

const API_TOKEN = envVars.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = envVars.CLOUDFLARE_ACCOUNT_ID;

if (!API_TOKEN) {
    console.error('Missing CLOUDFLARE_API_TOKEN in .env.r2');
    process.exit(1);
}

// Set wrangler env
process.env.CLOUDFLARE_API_TOKEN = API_TOKEN;
process.env.CLOUDFLARE_ACCOUNT_ID = ACCOUNT_ID;

async function main() {
    // Step 1: Extract zip
    console.log('Extracting zip...');
    if (fs.existsSync(EXTRACT_DIR)) {
        fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    execSync(`Expand-Archive -Path "${ZIP_PATH}" -DestinationPath "${EXTRACT_DIR}" -Force`, { shell: 'powershell.exe' });

    const pagesDir = path.join(EXTRACT_DIR, 'pages');
    const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.webp')).sort((a, b) => parseInt(a) - parseInt(b));
    console.log(`Found ${files.length} pages\n`);

    // Step 2: Upload each file via wrangler
    let uploaded = 0;
    let errors = 0;

    for (const file of files) {
        const filePath = path.join(pagesDir, file);
        const key = `pages/${file}`;

        try {
            execSync(
                `npx -y wrangler r2 object put "${BUCKET}/${key}" --file="${filePath}" --content-type="image/webp"`,
                { stdio: 'pipe', env: { ...process.env } }
            );
            uploaded++;
            process.stdout.write(`\r  Uploaded: ${uploaded}/${files.length} (${Math.round(uploaded / files.length * 100)}%)`);
        } catch (e) {
            errors++;
            console.error(`\n  Failed: ${key} - ${e.message}`);
        }
    }

    console.log(`\n\nDone! ${uploaded} uploaded, ${errors} errors`);

    // Step 3: Upload manifest
    const manifestPath = path.join(ROOT, 'quran-manifest.json');
    if (fs.existsSync(manifestPath)) {
        try {
            execSync(
                `npx -y wrangler r2 object put "${BUCKET}/manifest.json" --file="${manifestPath}" --content-type="application/json"`,
                { stdio: 'pipe', env: { ...process.env } }
            );
            console.log('Manifest uploaded');
        } catch (e) {
            console.error('Failed to upload manifest:', e.message);
        }
    }

    // Cleanup
    fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
    console.log('Temp files cleaned up');
    console.log(`\nTest: https://pub-5d133ff4b49a4efc8e066ad61b59a6d1.r2.dev/pages/1.webp`);
}

main().catch(console.error);
