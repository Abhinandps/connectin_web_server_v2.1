import { AbstractRepository } from "@app/common";
import { Injectable, Logger } from "@nestjs/common";
import { User } from "./schemas/user.schema";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model, Connection } from 'mongoose'


@Injectable()
export class UserRepository extends AbstractRepository<User>{
    protected readonly logger = new Logger(UserRepository.name)

    constructor(
        @InjectModel(User.name) userModel: Model<User>,
        @InjectConnection() connection: Connection,
    ) {
        super(userModel, connection)
    }
}












// //  // Custom method to add education information to a user
// //  async addEducationToUser(userId: string, educationData: Education) {
// //     const user = await this.userModel.findById(userId);

// //     if (!user) {
// //         throw new NotFoundException('User not found');
// //     }

// //     // Push the new education data to the user's education array
// //     user.education.push(educationData);

// //     return user.save();
// // }

// // // Custom method to update education information in a user
// // async updateEducationForUser(userId: string, educationId: string, updatedEducationData: Partial<Education>) {
// //     const user = await this.userModel.findById(userId);

// //     if (!user) {
// //         throw new NotFoundException('User not found');
// //     }

// //     // Find and update the education document within the user's education array
// //     const education = user.education.id(educationId);

// //     if (!education) {
// //         throw new NotFoundException('Education not found');
// //     }

// //     Object.assign(education, updatedEducationData);

// //     return user.save();
// // }
