import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { USER_SERVICE } from './constant/services';
import { ClientKafka } from '@nestjs/microservices';
import { REPORT_POST } from '@app/common';

@Injectable()
export class AnalyticsReportingService {


  constructor(
    private readonly reportRepository: ReportsRepository,
    @Inject(USER_SERVICE) private userClient: ClientKafka
  ) { }



  getHello(): string {
    this.userClient.emit('test', 'hellow world')
    return 'Hello World!';
  }


  async createReport(request: any, postId: string, { _id }: any, res: any) {

    try {

      const existingReport = await this.reportRepository.findOne({ post_id: postId })

      if (existingReport) {

        if (existingReport.user_id === _id) {
          throw new BadRequestException('Already Reported this post')
        } else {

          const response = await this.reportRepository.create({
            ...request,
            user_id: _id,
            post_id: postId,
            report_type: request.report_type,
          })

          const data = {
            postId: response.post_id,
            userId: response.user_id
          }

          console.log(data)

          this.userClient.emit(REPORT_POST, data)

          res.status(200).json({
            data: response
          })
          
        }

      } else {

        const response = await this.reportRepository.create({
          ...request,
          user_id: _id,
          post_id: postId,
          report_type: request.report_type,
        })

        const data = {
          postId: response.post_id,
          userId: response.user_id
        }

        console.log(data)

        this.userClient.emit(REPORT_POST, data)

        res.status(200).json({
          data: response
        })

      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }



}
