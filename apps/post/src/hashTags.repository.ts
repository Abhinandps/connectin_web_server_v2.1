import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection } from "mongoose";
import { HashTag } from "./schemas/hashTag.schema";


@Injectable()
export class HashTagRepository extends AbstractRepository<HashTag>{
    protected readonly logger = new Logger(HashTagRepository.name);

    constructor(
        @InjectModel(HashTag.name) HashTagModel: Model<HashTag>,
        @InjectConnection() connection: Connection
    ) {
        super(HashTagModel, connection)
    }
}