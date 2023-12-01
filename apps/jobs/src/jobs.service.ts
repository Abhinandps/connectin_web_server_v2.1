import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { JobRepository } from './jobs.repository';
import { Types } from 'mongoose';

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


  async getJob({ _id }: any, jobId: string, res: any) {
    try {
      const job = await this.jobRepository.findOne({ userId: _id, _id: jobId })

      if (job) {
        res.status(200).json({
          data: job
        })
      }


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
        description: null,
        skills: [],
        isDraft: true
      })

      res.status(200).json({
        data: response
      })

    } catch (err) {
      throw new BadRequestException(err)
    }
  }


  async updateJob(_id: string, jobId: string, updateJob: any, res: any) {
    try {

      updateJob.isDraft = false;

      const response = await this.jobRepository.findOneAndUpdate({
        userId: _id,
        _id: new Types.ObjectId(jobId)
      }, updateJob)

      res.status(200).json({
        data: response,
        message: 'Job updated successfully'
      })
    } catch (err) {
      throw new BadRequestException(err)
    }
  }


  async saveToDraft(_id: string, jobId: string, updateJob: any, res: any) {
    try {

      updateJob.isDraft = true;

      const response = await this.jobRepository.findOneAndUpdate({
        userId: _id,
        _id: new Types.ObjectId(jobId)
      }, updateJob)

      res.status(200).json({
        data: response,
        message: 'Job updated successfully'
      })
    } catch (err) {
      throw new BadRequestException(err)
    }
  }


}
