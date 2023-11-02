import { BadRequestException, Query, Controller, Get, Param, Post, Put, Req, Res, Body, Response, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { JwtAuthGuard, NEW_POST, HASHTAG_FOLLOWS, HASHTAG_UNFOLLOWS } from '@app/common';

@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  // FIXME: remove unwanted code 

  // @Get()
  // getHello(): string {
  //   return this.userService.getHello();
  // }


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


  // TODO:
  // @Get('user-activity')


  @Get()
  async getAllUsers(@Response() res) {
    const response = await this.userService.getAllUsers();
    return res.status(200).json({
      result: response.length,
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

  @Put(':userID')
  async updateUserProile(@Response() res, @Param('userID') userID: string) {
    // const response = await this.userService.updateProfile(userID);
  }


  @UseGuards(JwtAuthGuard)
  @Post('toggle-follow-hashtag')
  async toggleFollowHashtag(@Body() request: any, @Req() req: any, @Response() res) {
    return this.userService.toggleFollowHashtag(request, req.user, res)
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