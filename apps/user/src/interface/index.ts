
import { ObjectId } from 'mongodb'


export interface User {
    _id?: ObjectId;
    userId: ObjectId;
    firstName: string | null,
    lastName: string | null,
    headline: string | null,
    profileImage: string | null,
    coverImage: string | null,
}



