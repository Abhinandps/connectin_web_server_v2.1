import { Body, Controller, Get, Post, Query, Response } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDataDto, CreateJobDto } from './dto/create-job.dto';
import { validate } from 'class-validator';

@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Get()
  async getAllJobs(@Response() res) {
    return await this.jobsService.getAllJobs(res)
  }

  @Get('posted-jobs')
  async getPostedJobs(@Query() query: any, @Response() res) {
    return await this.jobsService.getPostedJobs(query, res)
  }

  @Post('create')
  async createJobs(@Body() createJob:CreateJobDto , @Query() query: any, @Response() res) {
    
    return await this.jobsService.createJobs(createJob, query, res)
  }

}
