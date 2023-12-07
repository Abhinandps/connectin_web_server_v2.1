import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection } from 'mongoose'
import { Chat } from "./schemas/chat.schema";


@Injectable()
export class chatRepository extends AbstractRepository<Chat>{
    protected readonly logger = new Logger(chatRepository.name)

    constructor(
        @InjectModel(Chat.name) chatModel: Model<Chat>,
        @InjectConnection() connection: Connection,
    ) {
        super(chatModel, connection)
    }
}



