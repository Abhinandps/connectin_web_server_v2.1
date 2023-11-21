import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobRepository } from './jobs.repository';

@Injectable()
export class JobsService {

  constructor(
    private readonly jobRepository: JobRepository
  ) { }


  async getAllJobs(res: any) {
    try {
      const response = await this.jobRepository.findAll()

      if (response.length < 1) {
        return res.status(200).json({
          data: []
        })
      }

      res.status(200).json({
        data: response
      })
    } catch (error) {
      throw new BadRequestException(error)
    }
  }


  async getPostedJobs({ _id }: any, res: any) {
    try {
      const jobs = await this.jobRepository.find({ userId: _id })

      if (jobs.length < 1) {
        return res.status(200).json({
          data: []
        })
      }

      res.status(200).json({
        data: jobs
      })

    } catch (error) {
      throw new BadRequestException(error)
    }
  }



  async createJobs(createJob: CreateJobDto, { _id }: any, res: any) {
    try {
      console.log(_id)
      const response = await this.jobRepository.create({
        ...createJob,
        userId: _id,
        responsibilities: [],
        qualifications: []
      })

      res.status(200).json({
        data: response
      })

    } catch (err) {
      throw new BadRequestException(err)
    }
  }



}
