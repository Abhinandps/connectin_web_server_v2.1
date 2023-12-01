import { Body, Controller, Get, Post, Query, Response, Put, Param } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDataDto, CreateJobDto, UpdateJobDataDto, UpdateJobDto } from './dto/create-job.dto';
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


  @Get(':jobId')
  async getJob(@Query() query: any, @Param('jobId') jobId: string, @Response() res) {
    return await this.jobsService.getJob(query, jobId, res)
  }



  @Post('create')
  async createJobs(@Body() createJob: CreateJobDataDto, @Query() query: any, @Response() res) {

    return await this.jobsService.createJobs(createJob.data, query, res)
  }


  // FIXME: UpdateJobDataDto is not working

  @Put(':jobId/update')
  async updateJob(@Query() query: any, @Param('jobId') jobId: string, @Body() updateJob: any, @Response() res) {
    const { _id } = query

    if (jobId === updateJob.data.jobId) {
      return await this.jobsService.updateJob(_id, jobId, updateJob.data, res)
    }
    return
  }


  @Put(':jobId/draft')
  async saveToDraft(@Query() query: any, @Param('jobId') jobId: string, @Body() updateJob: any, @Response() res) {
    const { _id } = query

    if (jobId === updateJob.data.jobId) {
      return await this.jobsService.saveToDraft(_id, jobId, updateJob.data, res)
    }
    return
  }

}
