import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/index';
import { nanoid } from 'nanoid';
import { ApiResponse } from '@transcendence/shared';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ProcessedImage {
  filename: string;
  url: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface AvatarUrls {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  original: string;
}

export class FileService {

  // Ensure upload directory exists
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(config.upload.uploadPath);
    } catch {
      await fs.mkdir(config.upload.uploadPath, { recursive: true });
      console.log(`Created upload directory: ${config.upload.uploadPath}`);
    }
  }

  // Validate file type and size
  private validateFile(file: UploadedFile): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > config.upload.maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds limit of ${config.upload.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Check mime type
    if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: ${config.upload.allowedMimeTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  // Generate unique filename
  private generateFilename(originalName: string, suffix?: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const baseName = nanoid(12);
    return suffix ? `${baseName}_${suffix}${ext}` : `${baseName}${ext}`;
  }

  // Process and resize image
  private async processImage(
    buffer: Buffer, 
    width: number, 
    height: number, 
    quality: number = 90
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ 
        quality, 
        progressive: true 
      })
      .toBuffer();
  }

  // Save file to disk
  private async saveFile(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(config.upload.uploadPath, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  // Delete file from disk
  private async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(config.upload.uploadPath, filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete file:', filename, error);
    }
  }

  // Upload and process avatar
  async uploadAvatar(file: UploadedFile, userId: number): Promise<ApiResponse<AvatarUrls>> {
    try {
      await this.ensureUploadDir();

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Invalid file',
          message: validation.error!
        };
      }

      // Generate base filename
      const baseFilename = this.generateFilename(file.originalName);
      const nameWithoutExt = path.parse(baseFilename).name;

      // Process images in different sizes
      const processedImages: { [key: string]: ProcessedImage } = {};

      // Original image (with compression)
      const originalBuffer = await this.processImage(file.buffer, 1024, 1024, 85);
      const originalFilename = `${nameWithoutExt}_original.jpg`;
      await this.saveFile(originalBuffer, originalFilename);

      processedImages.original = {
        filename: originalFilename,
        url: `/static/uploads/${originalFilename}`,
        size: originalBuffer.length,
        dimensions: { width: 1024, height: 1024 }
      };

      // Generate different sizes
      for (const [sizeName, dimensions] of Object.entries(config.upload.avatarSizes)) {
        const resizedBuffer = await this.processImage(
          file.buffer, 
          dimensions.width, 
          dimensions.height, 
          85
        );
        
        const filename = `${nameWithoutExt}_${sizeName}.jpg`;
        await this.saveFile(resizedBuffer, filename);

        processedImages[sizeName] = {
          filename,
          url: `/static/uploads/${filename}`,
          size: resizedBuffer.length,
          dimensions
        };
      }

      // Create URL object
      const avatarUrls: AvatarUrls = {
        thumbnail: processedImages.thumbnail.url,
        small: processedImages.small.url,
        medium: processedImages.medium.url,
        large: processedImages.large.url,
        original: processedImages.original.url
      };

      return {
        success: true,
        data: avatarUrls
      };

    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: 'Upload failed',
        message: 'An error occurred while processing the avatar'
      };
    }
  }

  // Delete avatar files
  async deleteAvatar(avatarUrl: string): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!avatarUrl) {
        return {
          success: true,
          data: { message: 'No avatar to delete' }
        };
      }

      // Extract filename from URL
      const urlParts = avatarUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      if (!filename) {
        return {
          success: false,
          error: 'Invalid avatar URL',
          message: 'Could not extract filename from URL'
        };
      }

      // Get base filename (remove size suffix)
      const nameWithoutExt = path.parse(filename).name;
      const baseName = nameWithoutExt.replace(/_\w+$/, ''); // Remove _size suffix

      // Delete all size variants
      const sizes = ['thumbnail', 'small', 'medium', 'large', 'original'];
      const deletePromises = sizes.map(size => 
        this.deleteFile(`${baseName}_${size}.jpg`)
      );

      await Promise.allSettled(deletePromises);

      return {
        success: true,
        data: { message: 'Avatar deleted successfully' }
      };

    } catch (error) {
      console.error('Delete avatar error:', error);
      return {
        success: false,
        error: 'Delete failed',
        message: 'An error occurred while deleting the avatar'
      };
    }
  }

  // Get file info
  async getFileInfo(filename: string): Promise<{ exists: boolean; size?: number; path?: string }> {
    try {
      const filePath = path.join(config.upload.uploadPath, filename);
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        path: filePath
      };
    } catch {
      return { exists: false };
    }
  }

  // Clean up old files (can be called periodically)
  async cleanupOldFiles(maxAgeInDays: number = 30): Promise<{ deletedCount: number }> {
    try {
      const files = await fs.readdir(config.upload.uploadPath);
      const maxAge = Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        try {
          const filePath = path.join(config.upload.uploadPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < maxAge) {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`Deleted old file: ${file}`);
          }
        } catch (error) {
          console.error(`Failed to process file ${file}:`, error);
        }
      }

      return { deletedCount };
    } catch (error) {
      console.error('Cleanup error:', error);
      return { deletedCount: 0 };
    }
  }
}

export const fileService = new FileService(); 