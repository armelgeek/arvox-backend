
# arvox-minio

MinIO client/service package for Arvox backend framework (S3 compatible).

## Features
- Easy MinIO client setup (S3 compatible)
- Bucket and object management
- File upload (simple & multipart)
- Presigned URLs for secure access
- ZIP extraction and upload
- Download files
- TypeScript types

## Usage Example

```ts
import { ArvoxMinioService, GenericFileService } from 'arvox-minio'

// Service MinIO générique
const minio = new ArvoxMinioService({
  bucketName: 'images',
  baseUrl: 'http://localhost:9000',
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
})

// Service métier réutilisable pour n'importe quel dossier/type
const avatarService = new GenericFileService({
  folder: 'avatars',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: 5 * 1024 * 1024,
  possibleExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
}, minio)

// Upload
await avatarService.upload(file)

// Vérifier existence
const exists = await avatarService.exists(id)

// URL publique
const url = avatarService.getPublicUrl(id, 'jpg')

// URL signée
const signedUrl = await avatarService.getSignedUrl(id, 'jpg')

// Suppression
await avatarService.delete(id)
```

## Environment Variables
```
MINIO_BUCKET_NAME=images
MINIO_API_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## License
MIT
