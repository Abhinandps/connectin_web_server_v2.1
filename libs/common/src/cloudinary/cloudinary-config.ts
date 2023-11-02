
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: "ds7fy5acd",
    api_key: "735756652441674",
    api_secret: "EutiXv8jHicTZusw17atakpxoR0",
    // cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    // api_key: process.env.CLOUDINARY_API_KEY,
    // api_secret: process.env.CLOUDINARY_API_SECRET,
})


export const cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
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
            return {};
        }
    },
})



