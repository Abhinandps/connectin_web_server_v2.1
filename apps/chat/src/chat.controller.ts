import { Body, Controller, Get, Post, Query, Response, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Get()
  async getUserChats(@Query() query: any, @Response() res) {
    const { _id } = query
    return this.chatService.getUserChat(_id, res)
  }

  @Get('find/:firstId/:secondId')
  async findChat(@Query() query: any, @Param('firstId') firstId: string, @Param('secondId') secondId: string, @Response() res) {
    // const { _id } = query
    return this.chatService.findChat(firstId, secondId, res)
  }

  @Post('/add')
  async addMessage(@Body() request: any, @Query() query: any, @Response() res) {
    return this.chatService.addMessage(request.data, query, res)
  }

  @Post('/mark-as-read/:firstId/:secondId')
  async markAsRead(@Query() query: any, @Param('firstId') firstId: string, @Param('secondId') secondId: string, @Response() res) {
    return this.chatService.markAsRead(firstId, secondId, res)
  }

  @Post('create')
  async createChat(@Body() participants: any, @Response() res) {
    return this.chatService.createChat(participants.data, res)
  }



  // @Post('send-message')
  // sendMessage(@Body() message: { sender: string; content: string }): string {
  //   return this.chatService.getHello();
  // }
}
