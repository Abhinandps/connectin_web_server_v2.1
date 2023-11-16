import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection } from 'mongoose'
import { Subscription } from "./schemas/payment.schema";


@Injectable()
export class SubscriptionRepository extends AbstractRepository<Subscription>{
    protected readonly logger = new Logger(SubscriptionRepository.name)

    constructor(
        @InjectModel(Subscription.name) subscriptionModel: Model<Subscription>,
        @InjectConnection() connection: Connection,
    ) {
        super(subscriptionModel, connection)
    }
}





