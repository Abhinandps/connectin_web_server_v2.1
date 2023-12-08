import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

// class Location {
//     @IsNotEmpty()
//     @IsString()
//     name: string;

//     @IsNotEmpty()
//     @IsString()
//     id: string;
//   }

export class CreateJobDto {

    @IsNotEmpty()
    @IsString()
    jobTitle: string;

    @IsNotEmpty()
    @IsString()
    company: string;

    @IsNotEmpty()
    @IsString()
    workPlaceType: string;

    @IsNotEmpty()
    @IsString()
    // @ValidateNested()
    // @Type(() => Location)
    employeeLocation: string | any;

    @IsNotEmpty()
    @IsString()
    jobType: string;

}


export class UpdateJobDto {
    @IsNotEmpty()
    @IsString()
    description: string

    @IsNotEmpty()
    @IsString()
    skills: string[]


}



export class UpdateJobDataDto {
    @ValidateNested({ each: true })
    @Type(() => UpdateJobDto)
    data: UpdateJobDto;

    headers: any
}

export class CreateJobDataDto {
    @ValidateNested({ each: true })
    @Type(() => CreateJobDto)
    data: CreateJobDto;

    headers: any
}