import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class AnalyticsReportingService {


  constructor(
    private readonly reportRepository: ReportsRepository
  ) { }



  getHello(): string {
    return 'Hello World!';
  }

  
  async createReport(request: any, postId: string, { _id }: any, res: any) {
    const existingReport = await this.reportRepository.findOne({ post_id: postId })

    if (existingReport) {
      if (existingReport.user_id === _id) {
        throw new BadRequestException('Already Reported this post')
      }
    } else {
      const response = await this.reportRepository.create({
        ...request,
        user_id: _id,
        post_id: postId,
        report_type: request.reportType,
        report_count: 1
      })

      res.status(200).json({
        data: response
      })
    }
  }



}
