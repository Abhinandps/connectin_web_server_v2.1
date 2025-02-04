import { Controller, Get, Post, Put, Delete, Param, UseInterceptors, UploadedFiles, UseGuards, Req, Body, Response, UploadedFile, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CloudinaryMiddleware, JwtAuthGuard, USER_FOLLOWS, USER_UNFOLLOWS } from '@app/common';
import { CreatePostDto } from './dto/post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagePattern, Payload } from '@nestjs/microservices';


@Controller('api/v1/posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
  ) { }


  @MessagePattern(USER_FOLLOWS)
  async handleFollowedUserPost(@Payload() data: any, @Response() res) {
    return await this.postService.handleFollowedUserPost(data, res)
  }

  @MessagePattern(USER_UNFOLLOWS)
  async handleUnFollowedUserPost(@Payload() data: any, @Response() res) {
    return await this.postService.handleUnFollowedUserPost(data, res)
  }


  @Get('all')
  async getAllPosts(@Query() query: any, @Req() req: any, @Response() res) {
    const { _id } = query
    return await this.postService.getAllPosts(_id, res)
  }

  @Get(':postID')
  async getPost(@Param('postID') postId: string, @Response() res) {
    return await this.postService.getPost(postId, res)
  }


  @Post('liked-posts')
  async getUserLikedPosts(@Query() query: any, @Response() res) {
    return await this.postService.getUserLikedPosts(query, res)
  }


  @Post('create')
  async createPost(@Query() query: any, @Body() request: { data: CreatePostDto }, @Req() req: any, @Response() res) {
    return await this.postService.createPost(request.data, query, res)
  }

  // @UploadedFiles() files,

  @Post('/utils/upload-files')
  async uploadFiles(@Req() req: any, @Response() res) {
    console.log(req.body.files)
    const files = req.body.files
    const paths = files.map((file) => file.path);

    res.status(200).json(paths)

  }


  @Put('edit/:postID')
  // @UseInterceptors(CloudinaryMiddleware)
  async updatePost(@Query() query: any, @Param('postID') postId: string, @Body() request: any, @Req() req: any, @Response() res) {
    console.log(request.data)
    return await this.postService.editPost(postId, request.data, query, res)
  }



  @Delete('delete/:postID')
  async removePost(@Query() query: any, @Param('postID') postId: string, @Body() request, @Req() req: any, @Response() res) {
    return await this.postService.deletePost(postId, request, query, res)
  }


  @Put('likes/:postID')
  async addLikeToPost(@Query() query: any, @Param('postID') postId: string, @Req() req: any, @Response() res) {
    return await this.postService.toggleLikeToPost(postId, query, res)
  }


  @Post('comment/:postID')
  async createComments(@Query() query: any, @Param('postID') postId: string, @Body() request: { data: any }, @Req() req: any, @Response() res) {
    return await this.postService.createComments(postId, request.data, query, res)
  }


  @Delete('comment/:postID/:commentID')
  async deleteComments(@Query() query: any, @Param('postID') postId: string, @Param('commentID') commentId: string, @Req() req: any, @Response() res) {
    return await this.postService.deleteComments(postId, commentId, query, res)
  }


  @Post('comment/:postID/:commendID/replies')
  async createCommentsReply(@Query() query: any, @Param('postID') postId: string, @Param('commendID') commentId: string, @Body() request: string, @Req() req: any, @Response() res) {
    return await this.postService.createCommentsReply(postId, commentId, request, query, res)
  }


  // @Post(':postID/report')
  // async reportPost(@Query() query: any, @Param('postID') postId: string, @Body() request: string, @Req() req: any, @Response() res) {
  //   return await this.postService.reportPost(query, postId,request.data, res)
  // }


  /* TODO: 

  1. update comments
  2. delete comments
  3. update likes in comments
  */

  @Post('/hashtags/incrementFollowerCount/:userId/:hashtag')
  async incrementFollowerCount(@Param('userId') userId: string, @Param('hashtag') hashtag: string, @Req() req: any, @Response() res) {
    return await this.postService.incrementHashTagFollowerCount(userId, hashtag, res)
  }

  @Post('/hashtags/decrementFollowerCount/:userId/:hashtag')
  async decrementFollowerCount(@Param('userId') userId: string, @Param('hashtag') hashtag: string, @Response() res) {
    return await this.postService.decrementHashTagFollowerCount(userId, hashtag, res)
  }

  // @UseGuards(JwtAuthGuard)
  @Post('test-kafka')
  async sendTestKafkaMessage(@Body() message: string) {
    this.postService.test(message)
  }


}
