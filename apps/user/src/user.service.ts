import { BadRequestException, Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserCreatedEvent } from './dto/user-created.event';
import { Types } from 'mongoose';
import { User } from './schemas/user.schema';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) { }

  // getHello(): string {
  //   return 'Hello World!';
  // }

  //Create User Based on Evnet
  async createUser(request: UserCreatedEvent) {
    await this.validateCreateUserRequest(request)
    try {
      await this.userRepository.createPartial({
        ...request,
        userId: new Types.ObjectId(request.userId),
        firstName: request.firstName,
        lastName: request.lastName
      })
    } catch (er) { }
  }


  // List All Users
  async getAllUsers() {
    try {
      const users = await this.userRepository.findAll();
      return users;
    } catch (err) {
      throw new BadRequestException(err)
    }
  }


  // Get One User
  async getUser(userID: string) {
    try {
      const user = await this.userRepository.findOne({ userId: new Types.ObjectId(userID) });
      return user;
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  // Update profiles




  // Admin 

  // List All Admins
  async getAllAdmins() {
    try {
      const serviceURL = `${this.configService.get('AUTH_SERVICE_URI')}/get_all_admin`;

      const response = await axios({
        method: 'GET',
        url: serviceURL,
        withCredentials: true
      });

      const data = response.data




      // Get the IDs of the admins from the response.
      const adminIds = data.map((admin) => admin._id);

      const adminObjectIds = adminIds.map((adminId) => new Types.ObjectId(adminId));


      // Find the details of the admins using the IDs.
      const adminDetails = (await this.userRepository.find({ userId: { $in: adminObjectIds } }))
        .map(async (admin) => {
          const email = data.find((user) => user._id === admin.userId.toString()).email;
          return {
            _id: admin.userId,
            email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            headline: admin.headline,
            profileImage: admin.profileImage
          };

        });

      // console.log(await Promise.all(adminDetails));
      return await Promise.all(adminDetails);
    } catch (err) {
      throw new BadRequestException(err)
    }
  }


  public async getAllRoleUsers() {
    const serviceURL = `${this.configService.get('AUTH_SERVICE_URI')}/get_all_role_users`;

    const response = await axios({
      method: 'GET',
      url: serviceURL,
      withCredentials: true
    });

    const data = response.data



    // Get the IDs of the admins from the response.
    const userIds = data.map((user) => user._id);



    const userObjectIds = userIds.map((userId) => new Types.ObjectId(userId));


    // Find the details of the users using the IDs.
    const userDetails = (await this.userRepository.find({ userId: { $in: userObjectIds } }))
      .map(async (user) => {
        const email = data.find((item) => item._id === user.userId.toString()).email;

        return {
          _id: user.userId,
          email,
          firstName: user.firstName,
          lastName: user.lastName,
          headline: user.headline,
          profileImage: user.profileImage
        };

      });

    console.log(await Promise.all(userDetails));
    return await Promise.all(userDetails);
  } catch(err) {
    throw new BadRequestException(err)
  }


  // search

  async search(query: string) {

    const regexPattern = new RegExp(query, 'i');

    // const filterQuery = {
    //   $or: [
    //     { firstName: { $regex: regexPattern } },
    //     { lastName: { $regex: regexPattern } },
    //   ],
    // };

    const users = await this.getAllRoleUsers();



    // Filter the users
    const filteredUsers = users.filter((user) => {
      return user.firstName.match(regexPattern) || user.lastName.match(regexPattern);
    });



    // Return the filtered users
    return filteredUsers;

  }

  // add admin
  async addAdmin(userID: string) {

    try {
      const serviceURL = `${this.configService.get('AUTH_SERVICE_URI')}/${userID}/add-admin`;

      const response = await axios({
        method: 'POST',
        url: serviceURL,
        withCredentials: true
      });

      const data = response.data

      return data

    } catch (err) {
      throw new BadRequestException(err)
    }

  }

  // remove admin
  async removeAdmin(userID: string) {

    try {
      const serviceURL = `${this.configService.get('AUTH_SERVICE_URI')}/${userID}/remove-admin`;

      const response = await axios({
        method: 'POST',
        url: serviceURL,
        withCredentials: true
      });

      const data = response.data

      return data

    } catch (err) {
      throw new BadRequestException(err)
    }

  }

  private async validateCreateUserRequest(request: UserCreatedEvent) {
    let user: User;
    try {
      user = await this.userRepository.findOne({
        _id: new Types.ObjectId(request.userId),
      })

    } catch (err) { }

    if (user) {
      throw new UnprocessableEntityException('Email alredy exists.')
    }
  }



}
