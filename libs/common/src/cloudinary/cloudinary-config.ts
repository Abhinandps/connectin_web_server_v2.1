
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


export const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
        console.log(req.body)

        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (isImage) {
            return {
                folder: 'image_folder',
                format: 'png',
                public_id: 'image_' + file.originalname,
            };
        } else if (isVideo) {
            return {
                folder: 'video_folder',
                resource_type: 'video',
                public_id: 'video_' + file.originalname,
            };
        } else {
            // Handle other file types or return default parameters
            return {
                folder: 'raw_folder',
                resource_type: 'raw',
                public_id: 'raw_' + file.originalname,
            };
            // return {};
        }
    },
})



