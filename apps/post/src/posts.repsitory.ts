import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { Post } from "./schemas/posts.schema";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection } from "mongoose";
import { HashTag } from "./schemas/hashTag.schema";



@Injectable()
export class PostRepository extends AbstractRepository<Post>{
    protected readonly logger = new Logger(PostRepository.name);

    constructor(
        @InjectModel(Post.name) postModel: Model<Post>,
        @InjectConnection() connection: Connection
    ) {
        super(postModel, connection)
    }
}
