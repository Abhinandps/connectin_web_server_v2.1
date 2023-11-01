

import { IsString, IsArray, IsOptional } from 'class-validator'

export class CreatePostDto {
    @IsString()
    contentType: string;

    @IsString()
    title: string;

    @IsString()
    contentBody: string;

    @IsArray()
    @IsOptional()
    attachments: string[];
}


