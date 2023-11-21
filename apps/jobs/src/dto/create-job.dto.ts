import { Type } from "class-transformer";
import { IsDefined, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";



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
    employeeLocation: string;

    @IsNotEmpty()
    @IsString()
    jobType: string;

}


// export class CreateJobDataDto {
//     @ValidateNested({ each: true })
//     @Type(() => CreateJobDto)
//     data: CreateJobDto;

//     headers: any
// }