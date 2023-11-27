import { BadRequestException, Inject, Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { UserCreatedEvent } from './dto/user-created.event';
import { Types } from 'mongoose';
// import { User } from './schemas/user.schema';
import { Neo4jUser } from './entity/user.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_SERVICE } from './constant/services';
import { ClientKafka } from '@nestjs/microservices';
import { CreateSubscriptionDto } from '@app/common/dto';
import { Neo4jService } from './neo4j/neo4j.service';
import { UserRepository } from './user.repository';
import { User } from './schemas/user.schema';
import { RedisService } from '@app/common/redis/redis.service';
import { POST_SERVICE, RedisPubSubService, USER_FOLLOWS, USER_UNFOLLOWS } from '@app/common';
import { UpdateUserDto, UserDto } from './dto/user-updated.dto';
import { UserGateway } from './websocket/user.gateway';
import { ConnectionRequestDto } from './dto/connection-request.dto';
import { types } from 'joi';

@Injectable()
export class UserService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService,
    private readonly redisPubSubService: RedisPubSubService,
    private readonly userGateway: UserGateway,
    @Inject(PAYMENT_SERVICE) private readonly paymentService: ClientKafka,
    @Inject(POST_SERVICE) private readonly postService: ClientKafka
  ) { }

  private hydrate(res): string | any {
    if (!res.records.length) {
      return undefined
    }

    const user = res.records[0].get('u')

    const jsonUser = new Neo4jUser(user).toJson()

    return jsonUser
  }

  // Create User Based on Event
  async createUser(request: UserCreatedEvent) {
    await this.validateCreateUserRequest(request)

    try {
      const newUser = await this.userRepository.createPartial({
        ...request,
        userId: new Types.ObjectId(request.userId),
        firstName: request.firstName,
        lastName: request.lastName
      })

      if (!newUser) {
        throw new BadRequestException('user not created')
      }

      const { userId, firstName, lastName, headline, profileImage, coverImage } = newUser;

      await this.redisService.set(`user:${newUser.userId}`, JSON.stringify({ userId, firstName, lastName, headline, profileImage, coverImage }))

      await this.validateNeo4jCreateUserRequest(request)
      const res = await this.neo4jService.write(`
   CREATE (u:USER {
     userId: $userId,
     firstName: $firstName,
     lastName: $lastName,
     headline: COALESCE($headline, null),
     profileImage: COALESCE($profileImage, null),
     coverImage: COALESCE($coverImage, null)
   })`, {
        userId: request.userId,
        firstName: request.firstName,
        lastName: request.lastName,
        headline: '',
        profileImage: '',
        coverImage: ''
      });


      return this.hydrate(res)
    } catch (er) {
      console.log(er);

    }
  }

  async validateNeo4jCreateUserRequest(request: UserCreatedEvent) {
    try {
      const existingUser = await this.neo4jService.read(`
        MATCH (u:USER {userId: $userId})
        RETURN u
      `, {
        userId: request.userId,
      });

      // console.log(existingUser)
      // console.log(typeof existingUser)

      if (existingUser.records.length > 0) {
        throw new UnprocessableEntityException('User with this userId already exists.');
      }
    } catch (err) {
      // Handle errors
      console.error(err);
      throw new InternalServerErrorException('Error while validating user existence.');
    }
  }


  // List All Users
  async getAllUsers(searchTerm: string | null) {
    try {
      if (searchTerm) {

        const users = await this.neo4jService.read(`
      MATCH (u:USER)
      WHERE u.firstName =~ '^' + $searchTerm + '.*' 
      RETURN u
      `, { searchTerm });

        const res = users.records.map(record => {
          const userNode = record.get('u');
          const neo4jUser = new Neo4jUser(userNode);
          return neo4jUser.toJson();
        });

        return res;
      } else {

        const users = await this.neo4jService.read(`
        MATCH (u:USER)
        RETURN u
      `);

        const res = users.records.map(record => {
          const userNode = record.get('u');
          const neo4jUser = new Neo4jUser(userNode);
          return neo4jUser.toJson();
        });

        return res;
      }

    } catch (err) {
      console.error('Error in getAllUsers:', err);
      throw new BadRequestException(err)
    }
  }


  // get one user from neo4j 
  async getOneUser(_id: string, userId: string) {
    try {

      const user = await this.neo4jService.read(`
      MATCH (u:USER {userId: $userId})
      RETURN u
      `, { userId });

      const res = await this.hydrate(user)

      // const result = await Promise.all(
      //   resArray.map(async (user: any) => {
      //     const followStatus = await this.checkFollowStatus(_id, user.userId)
      //     const connectionStatus = await this.checkConnectionStatus(_id, user.userId)
      //     return { ...user, connectionStatus, followStatus }
      //   })
      // )

      const followStatus = await this.checkFollowStatus(_id, res.userId)
      const connectionStatus = await this.checkConnectionStatus(_id, res.userId)

      const result = { ...res, followStatus, connectionStatus }

      return result

    } catch (err) {
      throw new BadRequestException(err.message)
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

  // Get Feed
  async userFeed(_id: any) {
    try {
      const user = await this.userRepository.findOne({ userId: new Types.ObjectId(_id) });
      if (!user) {
        throw new BadRequestException('no user found')
      }

      if (user.feed.length < 1) {
        return []
      }

      const feedPromises = user.feed.map(async (pId: any) => {
        const serviceURL = `${this.configService.get('POST_SERVICE_URI')}/${pId}`;
        return axios({
          method: 'GET',
          url: serviceURL,
          withCredentials: true,
        });
      });

      const responses = await Promise.all(feedPromises);

      const results = responses.map((response) => {
        if (response.status === 200) {
          return response.data.data;
        } else {
          return { error: 'Error occurred' };
        }
      })
      return results
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  // Update profiles

  async updateUserProfile(_id: any, requestData: UserDto) {
    try {


      // update it 
      const updatedUser = await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(_id) }, requestData)

      if (!updatedUser) {
        throw new BadRequestException('User not found');
      }

      const { userId, firstName, lastName, headline, profileImage, coverImage } = updatedUser

      await this.redisService.set(`user:${_id}`, JSON.stringify({ userId, firstName, lastName, headline, profileImage, coverImage }))

      const message = JSON.stringify({
        userId: _id,
        data: { firstName, lastName, headline, profileImage, coverImage }
      })

      await this.redisPubSubService.publish('user-profile-updates', message)

      await this.updateUserProfileNeo4j(_id, requestData)

      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }

  }


  // updateUserProfileINNeo4j--
  async updateUserProfileNeo4j(userId: string, data: UserDto): Promise<any> {
    try {
      const query = `
        MATCH (u:USER {userId: $userId})
        SET u.firstName = coalesce($firstName, u.firstName),
            u.lastName = coalesce($lastName, u.lastName),
            u.headline = coalesce($headline, u.headline),
            u.profileImage = coalesce($profileImage, u.profileImage),
            u.coverImage = coalesce($coverImage, u.coverImage)
        RETURN u
      `;

      const parameters = {
        userId,
        firstName: data?.firstName,
        lastName: data?.lastName,
        headline: data?.headline,
        profileImage: data?.profileImage,
        coverImage: data?.coverImage,
      };

      const result = await this.neo4jService.write(query, parameters);
      return result

    } catch (err) {
      console.log(err);
    }
  }




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


  async handleAddFollowedUserPostsInFeed({ postIds, followerId }: any, res: any) {
    try {

      const user = await this.getUser(followerId)

      if (!user) {
        throw new BadRequestException('user not found')
      }

      const updateQuery: Partial<User> = { feed: user.feed || [] }

      // updateQuery.feed.unshift(...postIds);

      for (let postId of postIds) {
        // Generate a random index
        let index = Math.floor(Math.random() * (updateQuery.feed.length + 1));

        // Insert the post at the random index
        updateQuery.feed.splice(index, 0, postId);
      }

      // remove after 20 items
      if (updateQuery.feed.length > 20) {
        updateQuery.feed.splice(20, updateQuery.feed.length - 20);
      }

      // update it 
      await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(followerId) }, updateQuery)

    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async handleRemoveUnFollowedUserPostsInFeed({ postIds, followerId }: any, res: any) {
    try {

      const user = await this.getUser(followerId)

      if (!user) {
        throw new BadRequestException('user not found')
      }

      const updateQuery: Partial<User> = { feed: user.feed || [] }

      updateQuery.feed = updateQuery.feed.filter((postId: any) => !postIds.includes(postId))

      // update it 
      await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(followerId) }, updateQuery)

    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  // subscription

  async createSubscription(data: any) {

    try {

      const user = await this.getUser(data.userId)

      if (data.userId) {
        const updateQuery: Partial<User> = { premium_subscription: user.premium_subscription || [] }

        updateQuery.isPremium = true
        updateQuery.premium_subscription.push(data)
        // update it 
        return await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(data.userId) }, updateQuery)
      }

    } catch (err) {
      throw new BadRequestException(err)
    }

  }



  // FOLLOW, CONNECT 

  async getFollwing(_id: any, res: any) {
    try {
      const query = `
      MATCH (u:USER {userId: $userId}) -[:FOLLOWS]->(following:USER)
      RETURN following
      `

      const parameters = {
        userId: _id
      }

      const results = await this.neo4jService.read(query, parameters)


      const response = results.records.map(record => {
        const userNode = record.get('following');
        const neo4jUser = new Neo4jUser(userNode);
        return neo4jUser.toJson();
      });


      const follows = await Promise.all(
        response.map(async (user) => {
          const connectionStatus = await this.checkFollowStatus(_id, user.userId)
          return { ...user, connectionStatus }
        })
      )

      res.json(follows)

    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getFollowers(_id: any, res: any) {
    try {
      const query = `
      MATCH (u:USER {userId: $userId})<-[:FOLLOWS]-(following:USER)
      RETURN following
      `
      const parameters = {
        userId: _id
      }

      const results = await this.neo4jService.read(query, parameters)


      const response = results.records.map(record => {
        const userNode = record.get('following');
        const neo4jUser = new Neo4jUser(userNode);
        return neo4jUser.toJson();
      });


      const follows = await Promise.all(
        response.map(async (user) => {
          const connectionStatus = await this.checkFollowStatus(_id, user.userId)
          return { ...user, connectionStatus }
        })
      )

      res.json(follows)

    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }


  async follow(followerId: string, followingId: string): Promise<any> {
    try {

      if (followerId === followingId) {
        throw new BadRequestException('Not Allowed')
      }

      const query = `
      MATCH (follower:USER {userId: $followerId}), (following:USER {userId: $followingId})
      CREATE (follower)-[follow:FOLLOWS]->(following)
      RETURN follow
      `

      const parameters = {
        followerId: followerId,
        followingId: followingId
      }

      const result = await this.neo4jService.write(query, parameters)


      await this.postService.emit(USER_FOLLOWS, { followingId, followerId })

      return result

    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }


  async unfollow(followerId: string, followingId: string): Promise<any> {
    try {

      if (followerId === followingId) {
        throw new BadRequestException('Not Allowed')
      }

      const query = `
      MATCH (follower:USER {userId: $followerId})-[follow:FOLLOWS]->(following:USER {userId: $followingId})
      DELETE follow
      `

      const parameters = {
        followerId: followerId,
        followingId: followingId
      }


      const result = await this.neo4jService.write(query, parameters)
      await this.postService.emit(USER_UNFOLLOWS, { followingId, followerId })
      return result

    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }




  async getConnectionRequests(_id: string, res: any) {
    const user = await this.getUser(_id)

    const usersList = await this.getAllUsers()

    if (!user) {
      throw new BadRequestException('user not found')
    }

    if (user.invitations.length < 1) {
      return []
    }

    const connectionRequests = await Promise.all(user.invitations.map(async (invitationId: string) => {
      const invitedUser = usersList.find((user) => user.userId === invitationId);
      const connectionStatus = await this.checkConnectionStatus(_id, invitationId);
      return { ...invitedUser, connectionStatus };
    }));

    res.json(connectionRequests)

  }


  async getConnections(_id: string, res: any) {
    try {
      const user = await this.getUser(_id)

      const usersList = await this.getAllUsers()

      if (!user) {
        throw new BadRequestException('user not found')
      }

      if (user.connections.length < 1) {
        return []
      }

      const connections = await Promise.all(user.connections.map(async (connectionId: string) => {
        const connectedUser = usersList.find((user) => user.userId === connectionId.toString());
        const connectionStatus = await this.checkConnectionStatus(_id, connectionId.toString());
        return { ...connectedUser, connectionStatus };
      }));

      res.json(connections)
    } catch (err) {
      console.log(err)
    }
  }

  async sendConnectionRequest(_id: any, connectionRequestId: any): Promise<any> {
    try {

      const user = await this.getUser(connectionRequestId)

      if (!user) {
        throw new BadRequestException('user not found')
      }

      // check the connection pending exist
      const connectionStatus = await this.checkConnectionStatus(_id, connectionRequestId)

      if (connectionStatus === 'pending') {
        throw new BadRequestException('Already Sented connection request')
      } else {
        // create connection with status pending
        await this.createConnection(_id, connectionRequestId)

        // emit event to socket

        // save to db

        const updateQuery: Partial<User> = { invitations: user.invitations || [] }

        updateQuery.invitations.unshift(_id)

        await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(connectionRequestId) }, updateQuery)
      }
    } catch (err) {
      console.log(err.message);

    }
  }

  async acceptConnectionRequest(acceptorId: string, requestorId: string) {
    try {
      const sender = await this.getUser(requestorId)

      const receiver = await this.getUser(acceptorId)

      if (!sender || !receiver) {
        throw new BadRequestException('user not found')
      }

      // check the connection pending exist
      const connectionStatus = await this.checkConnectionStatus(acceptorId, requestorId)


      if (connectionStatus === 'connected') {
        throw new BadRequestException('Already connected request')
      }

      const result = await this.acceptConnection(acceptorId, requestorId)

      const updateQueryInSender: Partial<User> = { connections: sender.connections || [] }
      const updateQueryInReciver: Partial<User> = { connections: receiver.connections || [], invitations: receiver.invitations || [] }



      updateQueryInSender.connections.unshift(new Types.ObjectId(acceptorId))

      const index = updateQueryInReciver.invitations.indexOf(new Types.ObjectId(requestorId))

      updateQueryInReciver.invitations.splice(index, 1)

      updateQueryInReciver.connections.unshift(new Types.ObjectId(requestorId))



      await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(requestorId) }, updateQueryInSender)

      await this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(acceptorId) }, updateQueryInReciver)

    } catch (err) {
      console.log(err.message);
    }
  }


  async rejectConnection(acceptorId: string, requestorId: string) {
    try {
      //   // check the connection pending exist
      //   const connectionStatus = await this.checkConnectionStatus(acceptorId, requestorId)

      //   if (connectionStatus !== 'accepted' || 'pending') {
      //     throw new BadRequestException('Not Allowed To Remove connection')
      //   }

      const result = await this.rejectConnectionRequest(acceptorId, requestorId)

      this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(acceptorId) }, { $pull: { invitations: requestorId } })

    } catch (err) {
      console.log(err.message);
    }
  }


  async removeConnection(acceptorId: string, requestorId: string) {
    try {


      //   // check the connection pending exist
      const connectionStatus = await this.checkConnectionStatus(acceptorId, requestorId)

      console.log(connectionStatus, 'status')
      console.log(connectionStatus !== 'connected');


      if (connectionStatus !== 'connected' || connectionStatus === 'pending') {
        throw new BadRequestException(`You didn't connect yet the user`)
      }

      const result = await this.removeConnectionNodes(acceptorId, requestorId)


      await Promise.all([
        this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(requestorId) }, { $pull: { connections: new Types.ObjectId(acceptorId) } }),
        this.userRepository.findOneAndUpdate({ userId: new Types.ObjectId(acceptorId) }, { $pull: { connections: new Types.ObjectId(requestorId) } }),
      ]);

    } catch (err) {
      console.log(err.message);
    }
  }



  private async checkFollowStatus(id: string, following: string) {

    const query = `
    MATCH (sender:USER {userId: $sender})
OPTIONAL MATCH (sender)-[rel1:FOLLOWS]->(receiver:USER {userId: $receiver})
WITH rel1
OPTIONAL MATCH (sender)<-[rel2:FOLLOWS]-(receiver:USER {userId: $receiver})
WITH rel1,rel2
RETURN CASE
    WHEN rel1 IS NOT NULL THEN 'following'
    WHEN rel2 IS NOT NULL THEN 'follow'
    ELSE 'not followed'
END AS connectionStatus
    `

    const parameters = {
      sender: id,
      receiver: following
    }

    const result = await this.neo4jService.read(query, parameters)

    const connectionStatus = result.records[0]?.get('connectionStatus');
    console.log(connectionStatus)

    return connectionStatus;

  }


  private async checkConnectionStatus(id: string, userId: string) {



    const query = `
    MATCH (sender:USER {userId: $sender})
OPTIONAL MATCH (sender)-[rel1:CONNECTED]->(receiver:USER {userId: $receiver})
WITH rel1
OPTIONAL MATCH (sender)<-[rel3:CONNECTED]-(receiver:USER {userId: $receiver})
WITH rel1,rel3
OPTIONAL MATCH (sender)-[rel2:PENDING_CONNECTION]->(receiver:USER {userId: $receiver})
WITH rel1,rel3,rel2
OPTIONAL MATCH (sender)<-[rel4:PENDING_CONNECTION]-(receiver:USER {userId: $receiver})
WITH rel1,rel3,rel2,rel4
RETURN CASE
    WHEN rel1 IS NOT NULL THEN 'connected'
    WHEN rel3 IS NOT NULL THEN 'connected'
    WHEN rel2 IS NOT NULL THEN 'pending'
    WHEN rel4 IS NOT NULL THEN 'pending'
    ELSE 'connect'
END AS connectionStatus
    `

    const parameters = {
      sender: userId,
      receiver: id
    }

    const result = await this.neo4jService.read(query, parameters)

    const connectionStatus = result.records[0]?.get('connectionStatus');
    console.log(connectionStatus)

    return connectionStatus;

  }

  // create connection with status pending

  private async createConnection(id: string, userId: string) {

    const query = `
    MATCH (sender:USER {userId: $userId})
    MATCH (receiver:USER {userId: $otherUserId})
    CREATE (sender)-[:PENDING_CONNECTION]->(receiver)
    `

    const parameters = {
      userId: id,
      otherUserId: userId
    }

    const result = await this.neo4jService.write(query, parameters)

    return result

  }

  // accept connection with status accepted

  private async acceptConnection(acceptorId: string, requestorId: string) {
    const query = `
    MATCH (sender:USER {userId: $requestorId})-[rel:PENDING_CONNECTION]->(receiver:USER {userId:  $acceptorId})
    CREATE (sender)-[:CONNECTED]->(receiver)
    DELETE rel
    `

    const parameters = {
      requestorId: requestorId,
      acceptorId: acceptorId
    }

    const result = await this.neo4jService.write(query, parameters)

    return result
  }

  // reject connection request

  private async rejectConnectionRequest(acceptorId: string, requestorId: string) {
    console.log(acceptorId)
    const query = `
    MATCH (sender:USER {userId: $requestorId})-[rel:PENDING_CONNECTION]->(receiver:USER {userId: $acceptorId})
    DELETE rel
  `

    const parameters = {
      requestorId: requestorId,
      acceptorId: acceptorId
    }

    const result = await this.neo4jService.write(query, parameters)

    return result
  }

  // remove connection request

  private async removeConnectionNodes(acceptorId: string, requestorId: string) {
    const query = `
    MATCH (sender:USER {userId: $requestorId})
    OPTIONAL MATCH (sender)-[rel1:CONNECTED]->(receiver:USER {userId: $acceptorId})
    OPTIONAL MATCH (sender)<-[rel2:CONNECTED]-(receiver:USER {userId: $acceptorId})
    DELETE rel1, rel2
    
  `

    const parameters = {
      requestorId: requestorId,
      acceptorId: acceptorId
    }

    const result = await this.neo4jService.write(query, parameters)

    return result
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


  // private async validateCreateUserRequest(request: UserCreatedEvent) {
  //   try {
  //     const existingUser = await this.neo4jService.read(`
  //       MATCH (u:USER {userId: $userId})
  //       RETURN u
  //     `, {
  //       userId: request.userId,
  //     });

  //     if (existingUser.length > 0) {
  //       throw new UnprocessableEntityException('User with this userId already exists.');
  //     }
  //   } catch (err) {
  //     // Handle errors
  //     console.error(err);
  //     throw new InternalServerErrorException('Error while validating user existence.');
  //   }
  // }

}
