import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateUserRequest {

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsOptional()
    role: string;
}



export class UserSignInDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}


export class UserResetDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class UserOtpDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsNumber()
    @IsNotEmpty()
    otp: number;
}

export class UserChangePasswordDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    newPassword: string;

    @IsString()
    @IsNotEmpty()
    confirmNewPassword: string;
}










