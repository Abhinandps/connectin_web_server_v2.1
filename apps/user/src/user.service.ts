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


  // hashtag management
  async toggleFollowHashtag(request: any, { _id }: any, res: any) {

    try {
      const { hashtag } = request
      // check the user 
      const user = await this.getUser(_id)

      if (!user) {
        throw new BadRequestException('user not found')
      }

      const followedHashTags = user.followed_hashtags || []

      let updateQuery: Partial<User> = { followed_hashtags: user.followed_hashtags || [] };

      const hashtagIndex = followedHashTags.indexOf(hashtag);
      if (hashtagIndex !== -1) {
        // The hashtag is in the list, so remove it.
        updateQuery.followed_hashtags.splice(hashtagIndex, 1)
        await this.decrementFollowerCount(hashtag, _id)
      } else {
        // The hashtag is not in the list, so add it.
        updateQuery.followed_hashtags.push(hashtag)
        await this.incrementFollowerCount(hashtag, _id)
      }


      await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(_id) }, updateQuery)

      res.status(200).json({
        message: `${hashtag} ${hashtagIndex !== -1 ? 'unfollowed' : 'followed'} successfully`,
      });
    } catch (err) {
      throw new BadRequestException(err);
    }

  }


  // increment
  async incrementFollowerCount(hashtag: string, userId: string) {
    try {
      const updatedHashtag = hashtag.replace(/#/g, '') // remove hash
      const serviceURL = `${this.configService.get('POST_SERVICE_URI')}/hashtags/incrementFollowerCount/${userId}/${updatedHashtag}`;
      // const serviceURL = `http://localhost:3003/api/v1/posts/hashtags/incrementFollowerCount/${updatedHashtag}`;

      const response = await axios({
        method: 'POST',
        url: serviceURL,
        withCredentials: true
      });
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  // decrement
  async decrementFollowerCount(hashtag: string, userId: string) {
    try {
      const updatedHashtag = hashtag.replace(/#/g, '') // remove hash
      const serviceURL = `${this.configService.get('POST_SERVICE_URI')}/hashtags/decrementFollowerCount/${userId}/${updatedHashtag}`;
      // const serviceURL = `http://localhost:3003/api/v1/posts/hashtags/incrementFollowerCount/${updatedHashtag}`;

      const response = await axios({
        method: 'POST',
        url: serviceURL,
        withCredentials: true
      });
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  // post event

  // single post
  async handleNewPostCreated({ userId, postId }: any, res: any) {
    try {
      const user = await this.getUser(userId)

      if (!user) {
        throw new BadRequestException('user not found')
      }

      const updateQuery: Partial<User> = { feed: user.feed || [] }

      // prepend the id 
      updateQuery.feed.unshift(postId)


      // remove after 20 items
      if (updateQuery.feed.length > 20) {
        updateQuery.feed.splice(20, updateQuery.feed.length - 20);
      }

      // update it 
      await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, updateQuery)

      res.status(200).json({
        message: `Feed Added New Post : ${postId}`,
        data: user?.feed
      });

    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  // multiple posts from followed hashtag

  async handleNewPostsFromFollowedHashTag({ userId, postIds }: any, res: any) {
    const user = await this.getUser(userId)

    if (!user) {
      throw new BadRequestException('user not found')
    }

    const updateQuery: Partial<User> = { feed: user.feed || [] }

    console.log(postIds)

    postIds.forEach((id: any) => updateQuery.feed.push(id))

    // update it 
    await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, updateQuery)

  }


  async handleRemovePostsFromUnFollowedHashTag({ userId, postIds }: any, res: any) {
    const user = await this.getUser(userId)

    if (!user) {
      throw new BadRequestException('user not found')
    }

    console.log(postIds)

    const updateQuery: Partial<User> = { feed: user.feed || [] }
    updateQuery.feed = updateQuery.feed.filter((postId: any) => !postIds.includes(postId))

    console.log(updateQuery.feed)

    // update it 
    await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(userId) }, updateQuery)

  }




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
