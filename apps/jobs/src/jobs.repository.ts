import { AbstractRepository } from "@app/common";
import { Job } from "./schemas/jobs.schema";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { Resumes } from "./schemas/resume.schema";
import { Apply } from "./schemas/apply.schema";

@Injectable()
export class JobRepository extends AbstractRepository<Job>{
    protected readonly logger = new Logger(JobRepository.name)

    constructor(
        @InjectModel(Job.name) jobModel: Model<Job>,
        @InjectConnection() connection: Connection
    ) {
        super(jobModel, connection)
    }
}


@Injectable()
export class ResumeRepository extends AbstractRepository<Resumes>{
    protected readonly logger = new Logger(ResumeRepository.name)

    constructor(
        @InjectModel(Resumes.name) resumeModel: Model<Resumes>,
        @InjectConnection() connection: Connection
    ) {
        super(resumeModel, connection)
    }
}


@Injectable()
export class ApplyRepository extends AbstractRepository<Apply>{
    protected readonly logger = new Logger(ApplyRepository.name)

    constructor(
        @InjectModel(Apply.name) resumeModel: Model<Apply>,
        @InjectConnection() connection: Connection
    ) {
        super(resumeModel, connection)
    }
}


