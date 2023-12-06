import { Body, Controller, Get, Req, Post, Query, Response, Put, Param, Headers } from '@nestjs/common';
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

  @Get(':jobId/public')
  async getPublicJob(@Query() query: any, @Param('jobId') jobId: string, @Response() res) {
    return await this.jobsService.getPublicJob(query, jobId, res)
  }



  @Post('create')
  async createJobs(@Body() createJob: CreateJobDataDto, @Query() query: any, @Response() res) {

    return await this.jobsService.createJobs(createJob.data, query, res)
  }

  @Post('applicants')
  async getApplicants(@Query() query: any, @Response() res) {
    return await this.jobsService.getApplicants(query, res)
  }

  @Put('applicant/aproves')
  async handleAproval(@Query() query: any, @Body() request: any, @Response() res) {
    return await this.jobsService.handleAproval(query, request.data, res)
  }


  @Post('apply')
  async applyJobs(@Req() req: any, @Body() applyJob: any, @Query() query: any, @Response() res) {
    const { data } = applyJob

    return await this.jobsService.applyJobs(data, query, res)
  }


  @Post('get-resume')
  async getResume(@Query() query: any, @Response() res) {
    const response = await this.jobsService.getResume(query)

    res.status(200).json(response)
  }

  @Post('resume')
  async uploadFiles(@Query() query: any, @Req() req: any, @Response() res) {
    console.log(req.body.files)
    const files = req.body.files
    const paths = files.map((file) => file.path);

    await this.jobsService.uploadFile(query, paths)

    res.status(200).json(paths)

  }



  @Post('calendly-webhook')
  handleCalendlyWebhook(@Body() eventData: any, @Headers('x-hook-secret') hookSecret: string): string | any {
    // Validate the webhook payload using the hookSecret
    // if (this.validateWebhook(eventData, hookSecret)) {
    //   // Handle the Calendly webhook payload
    //   // Extract relevant information and process as needed
    //   return 'Webhook received successfully';
    // } else {
    //   // Invalid webhook, handle accordingly (e.g., log and reject)
    //   return 'Invalid webhook';
    // }

    console.log(eventData)
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
