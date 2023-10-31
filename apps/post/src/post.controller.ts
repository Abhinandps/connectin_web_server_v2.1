import { Controller, Get, Post, UseInterceptors, UploadedFiles, UseGuards, Req, Body } from '@nestjs/common';
import { PostService } from './post.service';
import { CloudinaryMiddleware, JwtAuthGuard } from '@app/common';
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
  // @UseInterceptors(CloudinaryMiddleware)
  // createPost(@UploadedFiles() files) {
  async createPost(@Req() req: any) {
    console.log(req.user,'from ')
    // console.log('user --')
    // this.eventEmitter.on('validate_user', (user) => {
    //   console.log(user, 'user')
    // })
  }

  // @UseGuards(JwtAuthGuard)
  @Post('test-kafka')
  async sendTestKafkaMessage(@Body() message: string) {
    this.postService.test(message)
  }


}
