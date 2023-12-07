import { Logger, NotFoundException } from '@nestjs/common';
import {
    FilterQuery,
    Model,
    Types,
    UpdateQuery,
    SaveOptions,
    Connection,
} from 'mongoose';


import { AbstractDocument } from './abstract.schema';


export abstract class AbstractRepository<TDocument extends AbstractDocument> {
    protected abstract readonly logger: Logger;

    constructor(
        protected readonly model: Model<TDocument>,
        private readonly connection: Connection,
    ) { }

    async create(
        document: Omit<TDocument, '_id'>,
        options?: SaveOptions,
    ): Promise<TDocument> {
        const createdDocument = new this.model({
            ...document,
            _id: new Types.ObjectId(),
        });
        return (
            await createdDocument.save(options)
        ).toJSON() as unknown as TDocument;
    }

    async createPartial(
        document: Partial<TDocument> & { _id?: Types.ObjectId },
        options?: SaveOptions,
    ): Promise<TDocument> {
        const createdDocument = new this.model({
            ...document,
            _id: document._id ?? new Types.ObjectId(),
        });
        return (
            await createdDocument.save(options)
        ).toJSON() as unknown as TDocument;
    }


    async findOne(filterQuery: FilterQuery<TDocument>): Promise<TDocument | any> {

        const document = await this.model.findOne(filterQuery, {}, { lean: true });

        // if (!document) {
        //     this.logger.warn('Document not found with filterQuery', filterQuery);
        //     throw new NotFoundException('Document not found.');
        // }

        return document;
    }

    async findById(id: string): Promise<TDocument | any> {
        const document = await this.model.findById(id, {}, { lean: true });
        return document;
    }


    async findOneAndUpdate(
        filterQuery: FilterQuery<TDocument>,
        update: UpdateQuery<TDocument> ,
    ) {
        const document = await this.model.findOneAndUpdate(filterQuery, update, {
            lean: true,
            new: true,
        });

        if (!document) {
            this.logger.warn(`Document not found with filterQuery:`, filterQuery);
            throw new NotFoundException('Document not found.');
        }

        return document;
    }

    async findOneAndRemove(filterQuery: FilterQuery<TDocument>) {
        const document = await this.model.findOneAndRemove(filterQuery, {
            lean: true,
        });

        if (!document) {
            this.logger.warn(`Document not found with filterQuery:`, filterQuery);
            throw new NotFoundException('Document not found.');
        }

        return document;
    }



    async upsert(
        filterQuery: FilterQuery<TDocument>,
        document: Partial<TDocument>,
    ) {
        return this.model.findOneAndUpdate(filterQuery, document, {
            lean: true,
            upsert: true,
            new: true,
        });
    }


    async find(filterQuery: FilterQuery<TDocument>) {
        return this.model.find(filterQuery, {}, { lean: true });
    }

    async findAll(filterQuery?: FilterQuery<TDocument>, sort?: Record<string, any>, paginateOptions?: { page?: number, limit?: number }): Promise<TDocument[]> {
        const documents = await this.model.find(filterQuery, undefined, {
            ...(paginateOptions || {}),
            sort
        });
        return documents;
    }

    // const posts = await postRepository.findAll({ createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, { sort: { createdAt: -1 }, paginateOptions: { page: 1, limit: 10 } });

    async startTransaction() {
        const session = await this.connection.startSession();
        session.startTransaction();
        return session;
    }
}

