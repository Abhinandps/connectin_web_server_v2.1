import { AbstractRepository } from "@app/common";
import { Job } from "./schemas/jobs.schema";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";

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



