import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ApplyRepository, JobRepository, ResumeRepository } from './jobs.repository';
import { Types } from 'mongoose';
import { NOTIFICATIONS_SERVICE } from '@app/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class JobsService {

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly resumeRepository: ResumeRepository,
    private readonly applyRepository: ApplyRepository,
    @Inject(NOTIFICATIONS_SERVICE) private readonly notifyService: ClientKafka
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

  async getPublicJob({ _id }: any, jobId: string, res: any) {
    try {
      const job = await this.jobRepository.findOne({ _id: jobId })
      const alredyApplied = await this.applyRepository.findOne({ userId: _id, jobId: jobId })

      console.log(alredyApplied)

      if (job) {
        res.status(200).json({
          data: alredyApplied ? { ...job, isApplied: true } : { ...job, isApplied: false }
        })
      }


    } catch (error) {
      throw new BadRequestException(error)
    }
  }

  async getApplicants({ _id }: any, res: any) {
    try {
      const applicants = await this.applyRepository.find({ hiringManager: _id })

      console.log(applicants)

      res.json(applicants && applicants || [])

    } catch (err) {
      throw new BadRequestException(err.message)
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

  async getResume({ _id }: any) {
    try {
      return await this.resumeRepository.findOne({ userId: _id })
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async uploadFile({ _id }: any, paths: any) {

    await this.resumeRepository.create({
      userId: _id,
      resume: paths[0]
    })

  }


  async handleAproval({ _id }: any, data: any, res: any) {
    try {
      const applyedjob = await this.applyRepository.findOneAndUpdate({
        hiringManager: _id,
        userId: data?.userId,
        jobId: data?.jobId
      }, {
        isApproved: true
      })

      if (applyedjob) {
        const job = await this.jobRepository.findOne({ _id: data?.jobId })

        const notificationContent = {
          data: {
            userId: data?.userId,
            jobId: data?.jobId,
            hiringManager: data?.hiringManager
          },
          message: `🎉Congratulations!🎉 Your job application for the role ${job?.jobTitle} at ${job?.company} has been accepted🎊.
          `,
          actionLink: data?.calendly,
        };

        this.notifyService.emit('send_interview_schedule_notification', {
          notification: notificationContent,
        });


      }





      res.json(applyedjob)
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async applyJobs(applyJob: any, { _id }, res: any) {
    try {

      const isAlredyApplied = await this.applyRepository.findOne({ userId: _id, jobId: applyJob?.jobId })

      if (isAlredyApplied) {
        return new BadRequestException('alredy applied')
      }

      console.log(`
      //   userId: ${_id},
      //   hiringManager: ${applyJob?.hiringManager},
      //   email: ${applyJob?.email},
      //   mobile: ${applyJob?.mobile},
      //   jobId: ${applyJob?.jobId},
      //   resume: ${applyJob?.resume},
      `)

      await this.applyRepository.create({
        userId: _id,
        hiringManager: applyJob?.hiringManager,
        email: applyJob?.email,
        mobile: applyJob?.mobile,
        jobId: applyJob?.jobId,
        resume: applyJob?.resume,
        isApproved: false
      })

    } catch (err) {
      throw new BadRequestException(err.message)
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
