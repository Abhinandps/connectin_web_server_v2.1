import { Controller, Get, Post, Body, Req, UseGuards, Response, Param } from '@nestjs/common';
import { AnalyticsReportingService } from './analytics-reporting.service';
import { JwtAuthGuard } from '@app/common';

@Controller('api/v1/reports')
export class AnalyticsReportingController {
  constructor(private readonly analyticsReportingService: AnalyticsReportingService) { }

  @Get()
  getHello(): string {
    return this.analyticsReportingService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':postID/report')
  async createReport(@Body() request: any, @Param('postID') postId: string, @Req() req: any, @Response() res) {
    return await this.analyticsReportingService.createReport(request, postId, req.user, res)
  }



}
