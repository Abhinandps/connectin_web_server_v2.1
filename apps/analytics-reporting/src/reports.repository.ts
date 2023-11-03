import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection } from 'mongoose'
import { Report } from "./schemas/report.schema";


@Injectable()
export class ReportsRepository extends AbstractRepository<Report>{
    protected readonly logger = new Logger(ReportsRepository.name)

    constructor(
        @InjectModel(Report.name) userModel: Model<Report>,
        @InjectConnection() connection: Connection,
    ) {
        super(userModel, connection)
    }
}




