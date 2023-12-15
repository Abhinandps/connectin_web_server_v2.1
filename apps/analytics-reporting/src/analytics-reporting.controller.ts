import { Controller, Get, Post, Body, Req, UseGuards, Response, Param, Query } from '@nestjs/common';
import { AnalyticsReportingService } from './analytics-reporting.service';
import { JwtAuthGuard } from '@app/common';

@Controller('api/v1/reports')
export class AnalyticsReportingController {
  constructor(private readonly analyticsReportingService: AnalyticsReportingService) { }

  @Get()
  getHello(): string {
    return this.analyticsReportingService.getHello();
  }

  @Post(':postID/report')
  async createReport(@Body() request: any, @Query() query: any, @Param('postID') postId: string, @Response() res) {
    return await this.analyticsReportingService.createReport(request.data, postId, query, res)
  }



}
