/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

/**
 * Cloudinary Service
 *
 * Handles image/video uploads, transformations, and CDN delivery.
 * Provides optimized asset URLs with automatic format negotiation (WebP fallback to JPG).
 *
 * Key Features:
 * - Automatic image optimization (quality, format, dimensions)
 * - Video streaming with adaptive bitrate
 * - Signed URLs for time-limited access
 * - Responsive image srcsets for different screen sizes
 * - WebP format with automatic fallback
 * - Lightweight CDN delivery with Cloudinary's edge servers
 *
 * Configuration:
 * - CLOUDINARY_CLOUD_NAME: Unique identifier for your Cloudinary account
 * - CLOUDINARY_API_KEY: Public API key (can be exposed)
 * - CLOUDINARY_API_SECRET: Private API key (keep secret)
 * - CLOUDINARY_UPLOAD_PRESET: Allows unsigned uploads from frontend
 */
@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Generate optimized image URL with automatic transformations
   * Formats: auto (WebP > jpg), quality: auto (75-85% compression)
   *
   * @param publicId - Cloudinary public ID (path without extension)
   * @param options - Transformation options
   * @returns CDN URL with transformations applied
   *
   * Example: getImageUrl('courses/python-101', { width: 600, height: 400 })
   * Returns: https://res.cloudinary.com/[cloud]/image/upload/w_600,h_400,c_fill,q_auto,f_auto/courses/python-101
   */
  getImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'crop' | 'thumb' | 'scale';
      quality?: 'auto' | number;
      format?: 'auto' | 'webp' | 'jpg' | 'png';
      radius?: number;
      gravity?: 'auto' | 'face' | 'center';
      effects?: string[];
      background?: string;
    } = {},
  ): string {
    const transformations: any = {};

    if (options.width) transformations.width = options.width;
    if (options.height) transformations.height = options.height;
    if (options.crop) transformations.crop = options.crop;
    if (options.quality !== undefined) {
      transformations.quality =
        options.quality === 'auto' ? 'auto' : options.quality;
    } else {
      transformations.quality = 'auto';
    }
    if (options.format) transformations.format = options.format || 'auto';
    if (options.radius) transformations.radius = options.radius;
    if (options.gravity) transformations.gravity = options.gravity;
    if (options.background) transformations.background = options.background;

    // Apply effects if specified
    if (options.effects && options.effects.length > 0) {
      transformations.effect = options.effects.join(':');
    }

    return cloudinary.url(publicId, transformations);
  }

  /**
   * Get optimized thumbnail URL with consistent dimensions
   * Auto-crops to focus on faces using gravity:face
   *
   * @param publicId - Cloudinary public ID
   * @param size - Preset size (small: 150x150, medium: 300x300, large: 600x400)
   * @returns Optimized thumbnail URL
   */
  getThumbnailUrl(
    publicId: string,
    size: 'small' | 'medium' | 'large' = 'medium',
  ): string {
    const sizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 400 },
    };

    return this.getImageUrl(publicId, {
      ...sizes[size],
      crop: 'thumb',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
    });
  }

  /**
   * Get video preview/poster image frame
   * Extracts frame at specified time offset
   *
   * @param videoPublicId - Cloudinary video public ID
   * @param timeOffset - Seconds into video (default 0 = first frame)
   * @returns Preview image URL
   */
  getVideoPreview(videoPublicId: string, timeOffset: number = 0): string {
    return cloudinary.url(videoPublicId, {
      resource_type: 'video',
      start_offset: timeOffset,
      duration: 0.5,
      format: 'jpg',
      quality: 'auto',
    });
  }

  /**
   * Generate responsive image srcset for multiple screen sizes
   * Includes 5 variants: 320w, 640w, 960w, 1280w, 1600w
   *
   * Usage in HTML:
   * <img srcset="[result]" sizes="(max-width: 640px) 100vw, 50vw" />
   *
   * @param publicId - Cloudinary public ID
   * @returns Srcset string for use in <img srcset>
   */
  getResponsiveImageSrcset(publicId: string): string {
    const sizes = [320, 640, 960, 1280, 1600];
    return sizes
      .map((w) => {
        const url = this.getImageUrl(publicId, {
          width: w,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        });
        return `${url} ${w}w`;
      })
      .join(', ');
  }

  /**
   * Generate WebP image URL (for explicit <picture> element usage)
   * Falls back to JPG for unsupported browsers via <picture>
   *
   * @param publicId - Cloudinary public ID
   * @param width - Image width
   * @param height - Image height
   * @returns WebP image URL
   */
  getWebPUrl(publicId: string, width?: number, height?: number): string {
    return this.getImageUrl(publicId, {
      width,
      height,
      format: 'webp',
      quality: 'auto',
    });
  }

  /**
   * Get JPG fallback URL for <picture> element
   * Use with <picture> for browser compatibility
   *
   * @param publicId - Cloudinary public ID
   * @param width - Image width
   * @param height - Image height
   * @returns JPG image URL
   */
  getJpgUrl(publicId: string, width?: number, height?: number): string {
    return this.getImageUrl(publicId, {
      width,
      height,
      format: 'jpg',
      quality: 'auto',
    });
  }

  /**
   * Generate signed URL with time-limited access
   * Useful for private course content, certificates
   *
   * @param publicId - Cloudinary public ID
   * @param expiresIn - Expiration time in seconds (default 300 = 5 min)
   * @returns Signed URL that expires after specified duration
   */
  getSignedUrl(publicId: string, expiresIn: number = 300): string {
    const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
    return cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      expires_at: timestamp,
    });
  }

  /**
   * Upload image from buffer with automatic optimizations
   * Applies transformations: resize, format conversion, quality optimization
   *
   * @param buffer - Image file buffer
   * @param folder - Folder in Cloudinary (e.g., 'courses', 'avatars')
   * @param publicId - Custom public ID (optional)
   * @returns Upload response with public_id, secure_url, etc.
   */
  async uploadImage(
    buffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          eager: [
            // Web optimized: responsive thumbnails
            {
              width: 150,
              height: 150,
              crop: 'thumb',
              gravity: 'auto',
              format: 'webp',
            },
            { width: 300, height: 300, crop: 'fill', format: 'webp' },
            { width: 600, height: 400, crop: 'fill', format: 'webp' },
          ],
          eager_async: true,
          quality: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        },
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload video with HLS streaming setup
   * Automatically creates adaptive bitrate variants
   *
   * @param buffer - Video file buffer
   * @param folder - Cloudinary folder
   * @param publicId - Custom public ID
   * @returns Upload response with video public_id
   */
  async uploadVideo(
    buffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'video',
          streaming_profile: 'hd', // Adaptive bitrate HLS
          quality: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        },
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Get video streaming URL (HLS/MPEG-DASH)
   * Returns m3u8 playlist for adaptive streaming
   *
   * @param videoPublicId - Cloudinary video public ID
   * @returns HLS streaming URL
   */
  getVideoStreamUrl(videoPublicId: string): string {
    return cloudinary.url(videoPublicId, {
      resource_type: 'video',
      format: 'm3u8',
      video_codec: 'auto',
      bit_rate: 'auto',
    });
  }

  /**
   * Delete image/video from Cloudinary
   * Frees up storage and limits Cloudinary costs
   *
   * @param publicId - Image/video public ID
   * @param resourceType - 'image' or 'video'
   */
  async deleteAsset(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<any> {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }

  /**
   * Get file size and metadata
   * Useful for monitoring storage usage and optimization
   *
   * @param publicId - Cloudinary public ID
   * @returns Asset metadata (bytes, format, dimensions, etc.)
   */
  async getAssetMetadata(publicId: string): Promise<any> {
    return cloudinary.api.resource(publicId);
  }

  /**
   * Batch delete images (e.g., when deleting a course)
   * Cascading deletion for cleanup
   *
   * @param publicIds - Array of Cloudinary public IDs
   */
  async batchDeleteAssets(publicIds: string[]): Promise<any> {
    return cloudinary.api.delete_resources(publicIds);
  }

  /**
   * Get CDN delivery statistics
   * Bandwidth, requests, unique visitors per month
   */
  async getDeliveryStats(): Promise<any> {
    return cloudinary.api.usage();
  }
}
