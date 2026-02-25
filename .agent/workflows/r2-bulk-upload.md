---
description: How to bulk-upload files to Cloudflare R2 using AWS CLI
---

# R2 Bulk Upload via AWS CLI

Wrangler CLI uploads one file at a time (~2 sec/file = 20+ min for 604 files).
AWS CLI uses multithreaded S3 multipart uploads — 604 files in ~5 seconds.

## 1. Get S3-Compatible API Keys from Cloudflare

1. Go to **Cloudflare Dashboard → R2 → Overview**
2. Click **"Manage R2 API Tokens"** (right sidebar)
3. Click **"Create API token"**
4. Grant **"Object Read & Write"** permission
5. Select the specific bucket (e.g., `sakinahtime-quran`)
6. Click **Create**
7. **⚠️ Copy the Access Key ID and Secret Access Key immediately** — the secret is only shown once!

## 2. Install AWS CLI v2 on Windows

// turbo
```powershell
winget install Amazon.AWSCLI
```

Or download from: https://awscli.amazonaws.com/AWSCLIV2.msi

## 3. Configure AWS CLI with R2 Credentials

```powershell
aws configure
```

Enter:
- **Access Key ID**: (from step 1)
- **Secret Access Key**: (from step 1)
- **Default region**: `auto`
- **Default output format**: `json`

## 4. Bulk Upload Files

Replace `<ACCOUNT_ID>` with your Cloudflare Account ID (found in R2 → Overview → right sidebar).

```powershell
aws s3 sync C:\path\to\your\local\pages\ s3://your-bucket-name/pages/ --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### Example for SakinahTime Quran pages:
```powershell
aws s3 sync C:\s\assets\images\quran_original_1300\ s3://sakinahtime-quran/pages/ --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## 5. Verify Upload

```powershell
aws s3 ls s3://your-bucket-name/pages/ --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com | Measure-Object -Line
```

Should show 604 lines (one per file).

## Notes
- The Cloudflare Account ID is NOT the same as the API token
- R2 is S3-compatible, so any S3 tool works (rclone, boto3, etc.)
- For uploading a single zip file, wrangler is fine: `npx wrangler r2 object put bucket-name/file.zip --file=./file.zip`
