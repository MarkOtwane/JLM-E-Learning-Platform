/* eslint-disable @typescript-eslint/require-await */

import { v2 as cloudinary } from 'cloudinary';
import * as multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CloudinaryProvider = {
  provide: 'MULTER_CLOUDINARY',
  useFactory: () => {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: async (req: any, file: Express.Multer.File) => {
        let resourceType: 'image' | 'video' | 'raw' = 'raw';

        if (file.mimetype.startsWith('image/')) resourceType = 'image';
        if (file.mimetype.startsWith('video/')) resourceType = 'video';

        return {
          folder: 'eLearning/content', //review this one later
          resource_type: resourceType,
          public_id: `${Date.now()}-${file.originalname}`,
        };
      },
    });

    return multer({ storage });
  },
};

export { cloudinary };
