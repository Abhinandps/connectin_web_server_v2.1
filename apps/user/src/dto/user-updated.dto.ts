// src/users/dto/update-user.dto.ts

import { Type } from 'class-transformer';
import { IsString, IsOptional, IsUrl, ValidateNested, IsNotEmpty } from 'class-validator';

export class UserDto {
    @IsString()
    @IsOptional()
    readonly firstName?: string;

    @IsString()
    @IsOptional()
    readonly lastName?: string;

    @IsString()
    @IsOptional()
    readonly profileImage?: string;

    @IsString()
    @IsOptional()
    @IsOptional()
    readonly coverImage?: string;

    @IsString()
    @IsOptional()
    readonly headline?: string;
}



export class UpdateUserDto {
    @ValidateNested()
    @Type(() => UserDto)
    data: UserDto
}