import { Injectable, NestMiddleware } from '@nestjs/common';
// import { v2 as cloudinary } from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { cloudinaryStorage } from './cloudinary-config';

@Injectable()
export class CloudinaryMiddleware implements NestMiddleware {
    private upload = multer({ storage: cloudinaryStorage }).array('files');

    use(req: Request, res: Response, next: NextFunction) {
        this.upload(req, res, (err: any) => {
            if (err) {
                console.log(err);
                res.status(400).json({ message: 'File upload error' });
            } else {
                next()
            }
        })
    }
}

