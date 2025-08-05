# Storage Service

File storage and management service for the Pika platform, providing secure upload, storage, and retrieval of user files including profile pictures, workout videos, and documents.

## 🚀 Quick Start

```bash
# Development
yarn nx run @pika/storage:local

# Build
yarn nx run @pikage:build

# Test
yarn vitest packages/services/storage
```

## 📋 Overview

The Storage Service handles all file storage operations for the Pika platform:

- **File Upload**: Secure multi-file uploads with validation
- **Storage Providers**: Flexible backend (AWS S3, local)
- **Image Processing**: Automatic resizing and optimization
- **Access Control**: Secure URL generation with expiry
- **File Management**: CRUD operations on stored files
- **Metadata Tracking**: File information and usage logs
- **CDN Integration**: Fast global content delivery

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── controllers/           # HTTP request handlers
│   └── FileController     # File operations
├── services/              # Business logic
│   └── StorageService     # Core storage logic
├── repositories/          # Data access layer
│   └── FileStorageLogRepository # File metadata
├── providers/             # Storage backends
│   ├── S3Provider         # AWS S3 integration
│   ├── AzureProvider      # Azure Blob Storage
│   └── LocalProvider      # Local filesystem
├── middleware/            # Custom middleware
│   ├── upload             # Multer configuration
│   └── validation         # File validation
├── routes/                # API route definitions
└── types/                 # TypeScript definitions
```

### Key Components

- **Provider Factory**: Switchable storage backends
- **Stream Processing**: Efficient large file handling
- **Virus Scanning**: Optional malware detection
- **Image Pipeline**: Automatic optimization
- **URL Signing**: Secure temporary access

## 🔌 API Endpoints

### File Operations

| Method | Endpoint                      | Description           |
| ------ | ----------------------------- | --------------------- |
| POST   | `/storage/upload`             | Upload single file    |
| POST   | `/storage/upload/multiple`    | Upload multiple files |
| GET    | `/storage/files/:id`          | Get file metadata     |
| GET    | `/storage/files/:id/download` | Download file         |
| DELETE | `/storage/files/:id`          | Delete file           |
| PUT    | `/storage/files/:id`          | Update metadata       |

### File Management

| Method | Endpoint                  | Description     |
| ------ | ------------------------- | --------------- |
| GET    | `/storage/files`          | List user files |
| POST   | `/storage/files/:id/copy` | Copy file       |
| POST   | `/storage/files/:id/move` | Move file       |
| GET    | `/storage/files/:id/url`  | Get signed URL  |

### Bulk Operations

| Method | Endpoint                 | Description           |
| ------ | ------------------------ | --------------------- |
| POST   | `/storage/bulk/delete`   | Delete multiple files |
| POST   | `/storage/bulk/download` | Create zip archive    |
| GET    | `/storage/usage`         | Storage usage stats   |

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
STORAGE_SERVICE_PORT=5510
STORAGE_SERVICE_NAME=storage

# Storage Provider
STORAGE_PROVIDER=s3 # Options: s3, azure, local
STORAGE_BUCKET=pika-uploads
STORAGE_REGION=us-east-1

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com

# Azure Configuration
AZURE_STORAGE_ACCOUNT=your-account
AZURE_STORAGE_KEY=your-key
AZURE_CONTAINER_NAME=uploads

# Local Storage
LOCAL_STORAGE_PATH=/var/pikaploads

# Upload Limits
MAX_FILE_SIZE_MB=50
MAX_FILES_PER_UPLOAD=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,mp4,pdf,doc,docx

# Image Processing
IMAGE_THUMBNAIL_SIZE=150x150
IMAGE_MEDIUM_SIZE=800x800
IMAGE_LARGE_SIZE=1920x1920
IMAGE_QUALITY=85

# Security
SIGNED_URL_EXPIRY_HOURS=24
ENABLE_VIRUS_SCAN=true
```

## 📁 File Categories

### Supported File Types

#### Images

- Profile pictures
- Gym photos
- Workout progress photos
- Achievement badges
- Social media posts

#### Videos

- Workout recordings
- Exercise demonstrations
- Progress videos
- Live session recordings

#### Documents

- Medical certificates
- PARQ forms
- Membership agreements
- Receipts and invoices

## 🧪 Testing

```bash
# Run all tests
yarn vitest packages/services/storage

# Integration tests
yarn vitest packages/services/storage/src/test/integration

# Test file upload
yarn vitest packages/services/storage --grep "upload"
```

## 🔄 Integration

### Service Dependencies

- **Database**: PostgreSQL for file metadata
- **Redis**: Upload progress tracking
- **User Service**: Owner validation
- **CDN**: CloudFront/Cloudflare integration

### Upload Flow

```typescript
// Multi-part upload process
async uploadFile(file: Express.Multer.File, userId: string) {
  // 1. Validate file
  await this.validateFile(file)

  // 2. Generate unique key
  const key = this.generateFileKey(file, userId)

  // 3. Process image if needed
  if (this.isImage(file)) {
    await this.processImage(file)
  }

  // 4. Upload to storage
  const result = await provider.upload(file, key)

  // 5. Save metadata
  await this.saveFileMetadata({
    userId,
    key,
    size: file.size,
    mimeType: file.mimetype,
    url: result.url
  })

  // 6. Return signed URL
  return this.generateSignedUrl(key)
}
```

## 🖼️ Image Processing

### Automatic Optimizations

- Format conversion (WebP for browsers that support it)
- Responsive image generation
- EXIF data stripping for privacy
- Compression based on quality settings
- Lazy loading placeholders

### Image Variants

```typescript
{
  original: "users/123/profile/original.jpg",
  thumbnail: "users/123/profile/thumb_150x150.jpg",
  medium: "users/123/profile/medium_800x800.jpg",
  large: "users/123/profile/large_1920x1920.jpg",
  webp: {
    thumbnail: "users/123/profile/thumb_150x150.webp",
    medium: "users/123/profile/medium_800x800.webp",
    large: "users/123/profile/large_1920x1920.webp"
  }
}
```

## 🔒 Security Features

### Access Control

- **Signed URLs**: Time-limited access tokens
- **IP Restrictions**: Optional IP whitelisting
- **User Validation**: Ownership verification
- **CORS Policy**: Configured origins only
- **Rate Limiting**: Upload/download limits

### Virus Scanning

```typescript
// ClamAV integration
if (ENABLE_VIRUS_SCAN) {
  const scanResult = await virusScanner.scan(file)
  if (scanResult.infected) {
    throw new Error(`Infected file detected: ${scanResult.virus}`)
  }
}
```

## 📊 Storage Analytics

### Metrics Tracked

- **Storage Usage**: Per user and total
- **Bandwidth**: Upload/download volumes
- **File Types**: Distribution analysis
- **Access Patterns**: Popular files
- **Error Rates**: Failed uploads

### Usage Reports

```json
{
  "userId": "user_123",
  "totalSize": 524288000, // 500MB
  "fileCount": 145,
  "breakdown": {
    "images": { "count": 120, "size": 314572800 },
    "videos": { "count": 20, "size": 188743680 },
    "documents": { "count": 5, "size": 20971520 }
  },
  "bandwidth": {
    "upload": 1073741824, // 1GB this month
    "download": 5368709120 // 5GB this month
  }
}
```

## 🚨 Error Handling

| Error Code | Description            |
| ---------- | ---------------------- |
| STO001     | File not found         |
| STO002     | File too large         |
| STO003     | Invalid file type      |
| STO004     | Upload failed          |
| STO005     | Storage quota exceeded |
| STO006     | Access denied          |
| STO007     | Virus detected         |

## 🌐 CDN Integration

### CloudFront Configuration

- Global edge locations
- Automatic cache invalidation
- Custom domain support
- HTTPS enforcement
- Bandwidth optimization

### Cache Strategy

```typescript
{
  profilePictures: "max-age=86400", // 1 day
  gymPhotos: "max-age=604800", // 1 week
  staticAssets: "max-age=31536000", // 1 year
  documents: "no-cache, private"
}
```

## 📈 Performance Optimization

- **Multipart Upload**: For files > 5MB
- **Parallel Processing**: Concurrent uploads
- **Stream Processing**: Memory efficient
- **Progressive Loading**: For large images
- **Bandwidth Throttling**: Fair usage

## 🔄 Future Enhancements

- [ ] Video transcoding pipeline
- [ ] AI-powered image tagging
- [ ] Blockchain storage verification
- [ ] P2P backup system
- [ ] Smart compression algorithms
- [ ] Real-time collaboration features
- [ ] Version control for documents
- [ ] Advanced search capabilities
