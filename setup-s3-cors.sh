#!/bin/bash

# Quick S3 CORS Setup Script for ICARE-CVD
# Run this to configure CORS on your S3 bucket

set -e

BUCKET_NAME="icare-cvd-071604987125-eu-north-1-an"
REGION="eu-north-1"
ACCESS_KEY="AKIARBK75MT2QLXU32NY"
SECRET_KEY="7bQGaavNcylPvApppYepZLGB57yWk8duBHbZYJhD"

echo "🚀 Setting up S3 CORS for bucket: $BUCKET_NAME"
echo ""

# Export credentials
export AWS_ACCESS_KEY_ID="$ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$SECRET_KEY"
export AWS_DEFAULT_REGION="$REGION"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first:"
    echo "   Linux/Mac: brew install awscli"
    echo "   Or: pip install awscli"
    exit 1
fi

echo "✓ AWS CLI found"
echo ""

# Create CORS configuration
CORS_CONFIG='{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-version-id", "x-amz-server-side-encryption"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "📋 Applying CORS configuration..."
aws s3api put-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --cors-configuration "$CORS_CONFIG" \
  --region "$REGION"

echo "✓ CORS configuration applied!"
echo ""

echo "🔍 Verifying CORS is set..."
aws s3api get-bucket-cors \
  --bucket "$BUCKET_NAME" \
  --region "$REGION"

echo ""
echo "✅ S3 CORS setup complete!"
echo ""
echo "Next steps:"
echo "1. Refresh your browser (Ctrl+Shift+R)"
echo "2. Try uploading a file again in Step 4"
echo ""
echo "If still having issues:"
echo "  - Check browser DevTools (F12) → Network tab"
echo "  - Look for the PUT request to S3"
echo "  - Check Response Headers for CORS headers"
