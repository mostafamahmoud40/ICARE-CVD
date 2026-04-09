# S3 CORS Configuration for ICARE-CVD

## Problem
Frontend file uploads fail with "Failed to fetch" error - this is a CORS issue with AWS S3.

## Solution: Configure S3 CORS

### Option 1: AWS CLI (Recommended)

```bash
# Set your AWS credentials first
export AWS_ACCESS_KEY_ID="AKIARBK75MT2QLXU32NY"
export AWS_SECRET_ACCESS_KEY="7bQGaavNcylPvApppYepZLGB57yWk8duBHbZYJhD"
export AWS_DEFAULT_REGION="eu-north-1"

# Apply CORS policy
aws s3api put-bucket-cors \
  --bucket icare-cvd-071604987125-eu-north-1-an \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-version-id", "x-amz-meta-*"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

# Verify CORS is set
aws s3api get-bucket-cors \
  --bucket icare-cvd-071604987125-eu-north-1-an
```

### Option 2: AWS Management Console

1. Go to **AWS S3 Console** → Your bucket → **Permissions** tab
2. Scroll to **CORS** section
3. Click **Edit**
4. Paste this policy:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **Save**

### Option 3: Test with cURL first

Before testing in browser, verify S3 CORS works:

```bash
# Get a presigned URL
BUCKET="icare-cvd-071604987125-eu-north-1-an"
KEY="documents/lab-reports/test.pdf"
REGION="eu-north-1"

# Generate presigned URL (modify credentials and date as needed)
PRESIGNED_URL="https://${BUCKET}.s3.${REGION}.amazonaws.com/${KEY}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIARBK75MT2QLXU32NY%2F20260409%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20260409T000553Z&X-Amz-Expires=3600&X-Amz-Signature=..."

# Try uploading a test file
curl -X PUT "$PRESIGNED_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary "@/path/to/test.pdf" \
  -v
```

If you see **403 Forbidden** or **CORS errors**, CORS is not configured.

## After Configuring CORS

1. **Refresh the browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache if needed
3. Try uploading a file again

## Still Having Issues?

**Check these:**
- Bucket name is correct: `icare-cvd-071604987125-eu-north-1-an`
- Region is correct: `eu-north-1`
- Credentials have correct permissions (S3 Full Access or at least `s3:PutObjectAcl`, `s3:PutObject`)
- No IP restrictions or bucket policies blocking uploads
- Presigned URL hasn't expired (default: 1 hour)

## Browser Console Debugging

Check browser DevTools **Network** tab:
- Look for the presigned URL PUT request
- Check **Response Headers** for CORS headers:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, PUT, GET`
  - `Access-Control-Allow-Headers: *`
