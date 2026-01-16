# AWS S3 Setup Guide

This project now uses AWS S3 for file uploads instead of UploadThing. Follow these steps to configure your S3 bucket and environment variables.

## Prerequisites

- AWS Account
- AWS CLI (optional, but helpful)

## Step 1: Create an S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click "Create bucket"
3. Choose a unique bucket name (e.g., `socialcal-uploads-prod`)
4. Select your preferred AWS region
5. **Uncheck** "Block all public access" (we need public read access for images)
6. Acknowledge the warning about public access
7. Click "Create bucket"

## Step 2: Configure Bucket CORS

1. Go to your bucket → Permissions tab → CORS section
2. Add the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Replace `https://yourdomain.com` with your production domain.

## Step 3: Make Bucket Publicly Readable

1. Go to your bucket → Permissions tab → Bucket policy
2. Add the following policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

## Step 4: Create IAM User with S3 Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Enter a username (e.g., `socialcal-s3-uploader`)
4. Click "Next"
5. Select "Attach policies directly"
6. Search for and select `AmazonS3FullAccess` (or create a custom policy for more security)
7. Click "Next" → "Create user"

### Create Access Keys

1. Click on your newly created user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Select "Application running outside AWS"
5. Click "Next" → "Create access key"
6. **Important:** Copy both the Access Key ID and Secret Access Key immediately (you won't be able to see the secret again)

## Step 5: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# AWS S3 Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_AWS_S3_BUCKET=your-bucket-name
```

**Replace:**
- `us-east-1` with your bucket's region
- `your_access_key_id` with your IAM user's Access Key ID
- `your_secret_access_key` with your IAM user's Secret Access Key
- `your-bucket-name` with your S3 bucket name

## Step 6: Install Dependencies

Run the following command to install the AWS SDK:

```bash
npm install
```

## Step 7: Test the Upload

1. Start your development server: `npm run dev`
2. Navigate to the event edit page or create a new event
3. Try uploading an image using the S3Uploader component
4. Verify the image appears correctly

## Security Best Practices

### Production Recommendations

1. **Use IAM roles instead of access keys** if deploying to AWS (EC2, Lambda, ECS, etc.)
2. **Create a custom IAM policy** with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

3. **Enable S3 bucket versioning** for backup and recovery
4. **Set up CloudFront CDN** for better performance and security
5. **Use signed URLs** for sensitive content (modify the code to use `getSignedUrl`)
6. **Enable S3 access logging** for audit trails
7. **Set up lifecycle policies** to automatically delete old uploads

## Folder Structure

The S3Uploader component uses the following folder structure in your bucket:

- `events/` - Event images
- `uploads/` - Default folder for other uploads

You can customize the folder when using the component:

```tsx
<S3Uploader
  folder="custom-folder"
  onUploadComplete={(url) => console.log(url)}
/>
```

## Troubleshooting

### CORS Errors
- Verify your CORS configuration includes your domain
- Make sure you're using the correct bucket region

### 403 Forbidden Errors
- Check your bucket policy allows public read access
- Verify your IAM user has the correct permissions
- Ensure your access keys are correct in `.env.local`

### Files Not Uploading
- Check the browser console for errors
- Verify your environment variables are set correctly
- Ensure the bucket exists and is in the correct region

## Migration Notes

This replaces the previous UploadThing integration. The following files were modified:

- Created: `/src/lib/s3.ts` - S3 utility functions
- Created: `/src/app/api/upload/route.ts` - Upload API endpoint
- Created: `/src/components/ui/s3-uploader.tsx` - Reusable upload component
- Modified: `/src/app/(main)/event/[id]/edit/page.tsx` - Uses S3Uploader
- Modified: `/src/app/(main)/profile/page.tsx` - Removed UploadThing import
- Modified: `/src/middleware.ts` - Removed UploadThing route exception
- Deleted: `/src/server/uploadthing.ts`
- Deleted: `/src/lib/uploadthing.ts`
- Deleted: `/src/app/api/uploadthing/route.ts`

## Cost Considerations

AWS S3 pricing (as of 2024):
- Storage: ~$0.023 per GB/month
- PUT requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests

For a typical application with moderate usage, monthly costs should be under $5-10.
