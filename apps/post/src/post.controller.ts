import { Controller, Get, Post, Put, Delete, Param, UseInterceptors, UploadedFiles, UseGuards, Req, Body, Response } from '@nestjs/common';
import { PostService } from './post.service';
import { CloudinaryMiddleware, JwtAuthGuard } from '@app/common';
import { CreatePostDto } from './dto/post.dto';
// import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('api/v1/posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    // private readonly eventEmitter: EventEmitter2
  ) { }

  @Get()
  getHello(): string {
    return this.postService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  @UseInterceptors(CloudinaryMiddleware)
  async createPost(@Body() request: CreatePostDto, @UploadedFiles() files, @Req() req: any, @Response() res) {
    return await this.postService.createPost(request, files, req.user, res)
  }


  @UseGuards(JwtAuthGuard)
  @Put('edit/:postID')
  // @UseInterceptors(CloudinaryMiddleware)
  async updatePost(@Param('postID') postId: string, @Body() request, @Req() req: any, @Response() res) {
    return await this.postService.editPost(postId, request, req.user, res)
  }


  @UseGuards(JwtAuthGuard)
  @Delete('delete/:postID')
  // @UseInterceptors(CloudinaryMiddleware)
  async removePost(@Param('postID') postId: string, @Body() request, @Req() req: any, @Response() res) {
    return await this.postService.deletePost(postId, request, req.user, res)
  }


  @UseGuards(JwtAuthGuard)
  @Put('likes/:postID')
  async addLikeToPost(@Param('postID') postId: string, @Req() req: any, @Response() res) {
    return await this.postService.toggleLikeToPost(postId, req.user, res)
  }

  @UseGuards(JwtAuthGuard)
  @Post('comment/:postID')
  async createComments(@Param('postID') postId: string, @Body() request: string, @Req() req: any, @Response() res) {
    return await this.postService.createComments(postId, request, req.user, res)
  }

  @UseGuards(JwtAuthGuard)
  @Post('comment/:postID/:commendID/replies')
  async createCommentsReply(@Param('postID') postId: string, @Param('commendID') commentId: string, @Body() request: string, @Req() req: any, @Response() res) {
    return await this.postService.createCommentsReply(postId, commentId, request, req.user, res)
  }


  /* TODO: 

  1. update comments
  2. delete comments
  3. update likes
  */


  // @UseGuards(JwtAuthGuard)
  @Post('test-kafka')
  async sendTestKafkaMessage(@Body() message: string) {
    this.postService.test(message)
  }


}
