import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { User } from "./schemas/user.schema";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection } from 'mongoose'


@Injectable()
export class UsersRepository extends AbstractRepository<User>{
    protected readonly logger = new Logger(UsersRepository.name)

    constructor(
        @InjectModel(User.name) userModel: Model<User>,
        @InjectConnection() connection: Connection,
    ) {
        super(userModel, connection)
    }
}


