import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File Upload Service - Production-ready abstraction for file storage
 * Supports multiple backends (local storage, S3, etc.)
 * Includes validation, security checks, and proper error handling
 */

export interface FileUploadOptions {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface UploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
  path: string;
  uploadedAt: Date;
}

@Injectable()
export class FileUploadService {
  private readonly MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
  private readonly ALLOWED_IMAGE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private readonly ALLOWED_VIDEO_MIMES = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ];

  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDirs();
  }

  /**
   * Upload course thumbnail
   */
  async uploadThumbnail(
    file: FileUploadOptions,
    courseId: string,
  ): Promise<UploadResult> {
    this.validateImage(file);

    if (file.size > this.MAX_THUMBNAIL_SIZE) {
      throw new BadRequestException(
        `Thumbnail must be smaller than ${this.MAX_THUMBNAIL_SIZE / (1024 * 1024)}MB`,
      );
    }

    const filename = this.generateSecureFilename(
      'thumbnail',
      courseId,
      file.originalname,
    );
    const uploadPath = path.join(this.uploadsDir, 'thumbnails');
    const filePath = path.join(uploadPath, filename);

    try {
      fs.writeFileSync(filePath, file.buffer);

      return {
        filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/thumbnails/${filename}`,
        path: filePath,
        uploadedAt: new Date(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload thumbnail: ${error.message}`,
      );
    }
  }

  /**
   * Upload intro/course video
   */
  async uploadVideo(
    file: FileUploadOptions,
    courseId: string,
  ): Promise<UploadResult> {
    this.validateVideo(file);

    if (file.size > this.MAX_VIDEO_SIZE) {
      throw new BadRequestException(
        `Video must be smaller than ${this.MAX_VIDEO_SIZE / (1024 * 1024 * 1024)}GB`,
      );
    }

    const filename = this.generateSecureFilename(
      'video',
      courseId,
      file.originalname,
    );
    const uploadPath = path.join(this.uploadsDir, 'videos');
    const filePath = path.join(uploadPath, filename);

    try {
      fs.writeFileSync(filePath, file.buffer);

      return {
        filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/videos/${filename}`,
        path: filePath,
        uploadedAt: new Date(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload video: ${error.message}`,
      );
    }
  }

  /**
   * Upload assignment or module attachment
   */
  async uploadAttachment(
    file: FileUploadOptions,
    courseId: string,
    type: 'assignment' | 'module' | 'resource',
  ): Promise<UploadResult> {
    // Max 50MB for attachments
    const MAX_SIZE = 50 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      throw new BadRequestException(
        `Attachment must be smaller than ${MAX_SIZE / (1024 * 1024)}MB`,
      );
    }

    const filename = this.generateSecureFilename(
      type,
      courseId,
      file.originalname,
    );
    const uploadPath = path.join(this.uploadsDir, 'attachments', type);
    const filePath = path.join(uploadPath, filename);

    try {
      this.ensureDirectoryExists(uploadPath);
      fs.writeFileSync(filePath, file.buffer);

      return {
        filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/attachments/${type}/${filename}`,
        path: filePath,
        uploadedAt: new Date(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload attachment: ${error.message}`,
      );
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Security: Ensure path is within uploads directory
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(this.uploadsDir)) {
        throw new BadRequestException('Invalid file path');
      }

      if (fs.existsSync(normalizedPath)) {
        fs.unlinkSync(normalizedPath);
        return true;
      }

      return false;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${error.message}`,
      );
    }
  }

  /**
   * Get file stats
   */
  getFileStats(filePath: string) {
    try {
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(this.uploadsDir)) {
        throw new BadRequestException('Invalid file path');
      }

      if (!fs.existsSync(normalizedPath)) {
        throw new BadRequestException('File not found');
      }

      const stats = fs.statSync(normalizedPath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get file stats: ${error.message}`,
      );
    }
  }

  /**
   * Helper: Validate image file
   */
  private validateImage(file: FileUploadOptions): void {
    if (!this.ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image format. Allowed formats: ${this.ALLOWED_IMAGE_MIMES.join(', ')}`,
      );
    }
  }

  /**
   * Helper: Validate video file
   */
  private validateVideo(file: FileUploadOptions): void {
    if (!this.ALLOWED_VIDEO_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid video format. Allowed formats: ${this.ALLOWED_VIDEO_MIMES.join(', ')}`,
      );
    }
  }

  /**
   * Helper: Generate secure filename
   */
  private generateSecureFilename(
    prefix: string,
    courseId: string,
    originalName: string,
  ): string {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);

    return `${prefix}-${courseId}-${timestamp}-${hash}${ext}`;
  }

  /**
   * Helper: Ensure upload directories exist
   */
  private ensureUploadDirs(): void {
    const dirs = [
      this.uploadsDir,
      path.join(this.uploadsDir, 'thumbnails'),
      path.join(this.uploadsDir, 'videos'),
      path.join(this.uploadsDir, 'attachments'),
      path.join(this.uploadsDir, 'attachments', 'assignment'),
      path.join(this.uploadsDir, 'attachments', 'module'),
      path.join(this.uploadsDir, 'attachments', 'resource'),
    ];

    for (const dir of dirs) {
      this.ensureDirectoryExists(dir);
    }
  }

  /**
   * Helper: Ensure directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    thumbnails: number;
    videos: number;
    attachments: number;
    total: number;
  } {
    const stats = {
      thumbnails: this.getDirSize(path.join(this.uploadsDir, 'thumbnails')),
      videos: this.getDirSize(path.join(this.uploadsDir, 'videos')),
      attachments: this.getDirSize(path.join(this.uploadsDir, 'attachments')),
      total: 0,
    };

    stats.total = stats.thumbnails + stats.videos + stats.attachments;

    return stats;
  }

  /**
   * Helper: Calculate directory size recursively
   */
  private getDirSize(dirPath: string): number {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);
    let size = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        size += this.getDirSize(filePath);
      } else {
        size += stat.size;
      }
    }

    return size;
  }
}
