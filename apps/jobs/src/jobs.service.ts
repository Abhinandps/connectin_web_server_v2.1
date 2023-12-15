import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { CreateJobDto, UpdateJobDto } from './dto/create-job.dto';
import { ApplyRepository, JobRepository, ResumeRepository, ScheduledRepository } from './jobs.repository';
import { Types } from 'mongoose';
import { NOTIFICATIONS_SERVICE } from '@app/common';
import { ClientKafka } from '@nestjs/microservices';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { response } from 'express';

@Injectable()
export class JobsService {

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly resumeRepository: ResumeRepository,
    private readonly applyRepository: ApplyRepository,
    private readonly scheduledRepository: ScheduledRepository,
    private readonly configService: ConfigService,
    @Inject(NOTIFICATIONS_SERVICE) private readonly notifyService: ClientKafka
  ) { }


  async getAllJobs(searchTerm: any, select: any, res: any) {
    try {
      const regexPattern = new RegExp(searchTerm, 'i');
      const regexSelect = new RegExp(select, 'i')
      const response = await this.jobRepository.findAll()

      if (response.length < 1) {
        return res.status(200).json({
          data: []
        })
      }

      if (searchTerm) {
        const filteredJobs = response.filter((job) => {
          return job?.employeeLocation.match(regexPattern)
        })

        return res.status(200).json({
          data: filteredJobs
        })
      }

      if (select) {
        const filteredJobs = response.filter((job) => {
          return job?.workPlaceType.match(regexSelect)
        })

        return res.status(200).json({
          data: filteredJobs
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


  async getScheduledInterviews({ _id }: any, res: any) {
    try {
      const response = await this.scheduledRepository.find({ userId: _id })
      res.json(response)
    } catch (err) {
      throw new BadRequestException(err.messa)
    }
  }

  async myInterviews({ _id }: any, res: any) {
    try {
      const response = await this.scheduledRepository.find({ hiringManager: _id })
      res.json(response)
    } catch (err) {
      throw new BadRequestException(err.messa)
    }
  }

  async saveScheduledInterview(data: any) {
    try {
      const { email, name, scheduled_event, event_type } = data

      const response = await this.createWherebyMeetingRoom(scheduled_event.start_time, scheduled_event.end_time, event_type.name)


      const userId = await this.findIdByEmail(email)
      const correctedJsonString = scheduled_event.event_memberships.replace(/'/g, '"');
      const dataArray = JSON.parse(correctedJsonString);
      const userEmail = dataArray[0].user_email;
      const hiringManagerId = await this.findIdByEmail(userEmail)

      if (response) {
        const res = await this.scheduledRepository.create({
          interviewe: email,
          interviewer: userEmail,
          userId,
          hiringManager: hiringManagerId || undefined,
          eventType: event_type.name,
          startDate: scheduled_event.start_time,
          endDate: scheduled_event.end_time,
          roomName: response.roomName,
          roomUrl: response.roomUrl,
          meetingId: response.meetingId,
          hostRoomUrl: response.hostRoomUrl,
        })


        const formattedStartDate = new Date(scheduled_event.start_time).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });


        const notificationContent = {
          data: {
            userId,
            hiringManager: hiringManagerId,
            meetingId: res.meetingId
          },
          message: `📅 Your ${event_type.name} is scheduled for ${formattedStartDate} from ${this.timeFinder(scheduled_event.start_time)} to ${this.timeFinder(scheduled_event.end_time)}. Be prepared and good luck! 🚀.
          `,
        };

        const notificationContentHiringManager = {
          data: {
            userId: hiringManagerId,
            meetingId: res.meetingId
          },
          message: `📅 Your ${event_type.name}  with ${name} is scheduled for ${formattedStartDate} from ${this.timeFinder(scheduled_event.start_time)} to ${this.timeFinder(scheduled_event.end_time)}.  Please be alert and ready at this time 🙌.
          `,
        };

        this.notifyService.emit('send_interview_schedule_notification', {
          notification: notificationContent,
        });

        this.notifyService.emit('send_interview_schedule_notification', {
          notification: notificationContentHiringManager,
        });

      }

    } catch (err) {
      throw new BadRequestException(err.message)
    }

  }

  private timeFinder(timestamp: any) {
    const date = new Date(timestamp);
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);

    return formattedTime
  }

  private async createWherebyMeetingRoom(startTime: string, endTime: string, eventType: string) {
    try {
      console.log(startTime, endTime, eventType)
      const wherebyApiKey = this.configService.get('WHEREBY_API_KEY');
      console.log(wherebyApiKey)
      const response = await axios.post('https://api.whereby.dev/v1/meetings', {
        startDate: startTime,
        endDate: endTime,
        fields: ['hostRoomUrl'],
      }, {
        headers: {
          Authorization: `Bearer ${wherebyApiKey}`,
        },
      });


      return response.data

    } catch (err) {
      console.error('Error creating meeting:', err.response?.data || err.message);
      throw new BadRequestException({
        message: 'Error creating Whereby meeting room',
        errorDetails: err.response?.data || err.message,
      });
    }
  }


  private async findIdByEmail(email: string) {
    try {
      const response = await axios.post(`http://localhost:3001/api/v1/auth/getId?email=${email}`);

      return response.data
    } catch (err) {
      throw new BadRequestException(err.message)
    }
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

      const response = await this.applyRepository.create({
        userId: _id,
        hiringManager: applyJob?.hiringManager,
        email: applyJob?.email,
        mobile: applyJob?.mobile,
        jobId: applyJob?.jobId,
        resume: applyJob?.resume,
        isApproved: false
      })

      res.json(response)

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
