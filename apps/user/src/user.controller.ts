import { BadRequestException, Query, Controller, Get, Delete, Param, Post, Put, Req, Res, Body, Response, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard, NEW_POST, HASHTAG_FOLLOWS, HASHTAG_UNFOLLOWS, USER_FOLLOWS, UPDATE_FEED_USER_FOLLOWS, UPDATE_FEED_USER_UNFOLLOWS } from '@app/common';
import { CreateSubscriptionDto } from '@app/common/dto';
import { UpdateUserDto, UserDto } from './dto/user-updated.dto';
import { ConnectionRequestDto } from './dto/connection-request.dto';


@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // FIXME: remove unwanted code 

  @EventPattern('create_user')
  async handleUserCreated(@Payload() data: any) {
    this.userService.createUser(data)
  }

  // Feed UptoDate

  // New_Post
  @MessagePattern(NEW_POST)
  async handleNewPostCreated(@Payload() data: any, @Response() res) {
    return await this.userService.handleNewPostCreated(data, res)
  }

  // New_Posts
  @MessagePattern(HASHTAG_FOLLOWS)
  async handleNewPostsFromFollowedHashTag(@Payload() data: any, @Response() res) {
    return await this.userService.handleNewPostsFromFollowedHashTag(data, res)
  }

  // REMOVE POSTS FROM USER FEED WHEN HASHTAG UNFOLLOWS
  @MessagePattern(HASHTAG_UNFOLLOWS)
  async handleRemovePostsFromUnFollowedHashTag(@Payload() data: any, @Response() res) {
    return await this.userService.handleRemovePostsFromUnFollowedHashTag(data, res)
  }

  @MessagePattern(UPDATE_FEED_USER_FOLLOWS)
  async handleFollowedUserPost(@Payload() data: any, @Response() res) {
    return await this.userService.handleAddFollowedUserPostsInFeed(data, res)
  }

  @MessagePattern(UPDATE_FEED_USER_UNFOLLOWS)
  async handleRemoveUnFollowedUserPostsInFeed(@Payload() data: any, @Response() res) {
    return await this.userService.handleRemoveUnFollowedUserPostsInFeed(data, res)
  }


  // TODO:
  // @Get('user-activity')

  @Get()
  async getAllUsers(@Query() query: any, @Response() res) {
    const { search } = query
    const response = await this.userService.getAllUsers(search);
    return res.status(200).json({
      data: response
    })
  }


  @Post('user/:userId')
  async getOneUser(@Query() query: any, @Param('userId') userId: string, @Response() res) {
    const { _id } = query
    const response = await this.userService.getOneUser(_id, userId);
    return res.status(200).json({
      data: response
    })
  }


  @Get('user')
  async getAllRoleUsers(@Response() res) {
    const response = await this.userService.getAllRoleUsers();
    return res.status(200).json({
      result: response.length,
      data: response
    })
  }


  @Get(':userID')
  async getUserProfile(@Response() res, @Param('userID') userID: string) {
    const response = await this.userService.getUser(userID);
    return res.status(200).json({
      data: response
    })
  }


  @Get('user/feed')
  async getUserFeed(@Query() query: any, @Response() res, @Req() req: any) {
    const { _id } = query
    const response = await this.userService.userFeed(_id);
    return res.status(200).json({
      data: response
    })
  }


  // TODO:
  /*
    - profile image
    - cover image
    - basic info
    - edit about
    - experience
    - education
    - skills
    - interests
  */

  @Put('edit/basic-info')
  async updateUserProile(@Query() query: any, @Response() res, @Body() requestData: UpdateUserDto) {
    const { _id } = query;

    return this.userService.updateUserProfile(_id, requestData.data)
  }


  @UseGuards(JwtAuthGuard)
  @Post('toggle-follow-hashtag')
  async toggleFollowHashtag(@Body() request: any, @Req() req: any, @Response() res) {
    return this.userService.toggleFollowHashtag(request, req.user, res)
  }


  // subscription

  // @Post('create-subscription')
  // async createSubscription(@Body() request: { data: CreateSubscriptionDto }, @Query() query: any, @Response() res) {
  //   const { _id } = query
  //   return await this.userService.createSubscription(request.data, _id, res)
  // }


  @MessagePattern('create_charge')
  async handleCreateCharge(@Payload() data: any) {
    return await this.userService.createSubscription(data)
  }


  // FOLLOW, CONNECT

  @Post('following')
  async getFollowing(@Query() query: any, @Response() res) {
    const { _id } = query;
    return this.userService.getFollwing(_id, res)
  }

  @Post('followers')
  async getFollowers(@Query() query: any, @Response() res) {
    const { _id } = query;
    return this.userService.getFollowers(_id, res)
  }

  @Post(':followingId/follow')
  async follow(@Query() query: any, @Param('followingId') followingId: string) {
    const { _id } = query;
    return this.userService.follow(_id, followingId)
  }

  @Delete(':followingId/unfollow')
  async unfollow(@Query() query: any, @Param('followingId') followingId: string) {
    const { _id } = query;
    return this.userService.unfollow(_id, followingId)
  }


  @Post('invitations')
  async getConnectionRequests(@Query() query: any, @Response() res) {
    const { _id } = query;

    return this.userService.getConnectionRequests(_id, res)
  }

  @Post('my-connections')
  async getConnections(@Query() query: any, @Response() res) {
    const { _id } = query;
    return this.userService.getConnections(_id, res)
  }

  @Post(':userId/send-connection-request')
  async sendConnectionRequest(@Query() query: any, @Param('userId') connectionRequestId: string) {
    const { _id } = query;

    return this.userService.sendConnectionRequest(_id, connectionRequestId)
  }

  @Post(':userId/accept-connection')
  async acceptConnection(@Query() query: any, @Param('userId') connectionRequestId: string) {
    const { _id } = query;

    return this.userService.acceptConnectionRequest(_id, connectionRequestId)
  }


  @Post(':userId/reject-connection')
  async rejectConnection(@Query() query: any, @Param('userId') connectionRequestId: string) {
    const { _id } = query;

    return this.userService.rejectConnection(_id, connectionRequestId)
  }

  @Post(':userId/remove-connection')
  async removeConnection(@Query() query: any, @Param('userId') connectionRequestId: string) {
    const { _id } = query;

    return this.userService.removeConnection(_id, connectionRequestId)
  }


  // admin 

  @Get(':id/admins')
  async getAllAdmins(@Response() res) {
    const response = await this.userService.getAllAdmins();
    return res.status(200).json({
      data: response
    })
  }


  @Get(':id/search-suggestion')
  async search(@Query('query') query: string, @Response() res) {

    const response = await this.userService.search(query);
    return res.status(200).json({
      data: response
    })
  }



  @Post(':userID/add-admin')
  async addAdmin(@Response() res, @Param('userID') userID: string) {
    const response = await this.userService.addAdmin(userID);
    return res.status(200).json({
      data: response
    })
  }


  @Post(':userID/remove-admin')
  async removeAdmin(@Response() res, @Param('userID') userID: string) {
    const response = await this.userService.removeAdmin(userID);
    return res.status(200).json({
      data: response
    })
  }


}