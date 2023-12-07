import { Injectable, BadRequestException } from '@nestjs/common';
import { chatRepository } from './chat.repository';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ChatService {

  constructor(
    private readonly chatRepository: chatRepository,
    private readonly configService: ConfigService
  ) { }


  async getUserChat(_id: string, res: any) {
    try {
      const chat = await this.chatRepository.find({
        "participants.userId": _id
      })

      res.json(chat)

    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async findChat(firstId: string, secondId: string, res: any) {
    try {
      const chat = await this.chatRepository.findOne({
        $and: [
          { "participants.userId": firstId },
          { "participants.userId": secondId },
        ],
      })

      res.json(chat)

    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async markAsRead(firstId: string, secondId: string, res: any) {
    try {

      const chat = await this.chatRepository.findOne({
        $and: [
          { "participants.userId": firstId },
          { "participants.userId": secondId },
          { "messages.isViewed": false },
        ],
      });

      if (!chat) {
        // Handle the case where the chat is not found
        return;
      }

      const indexOfUnreadMessage = chat.messages.findIndex(message => !message.isViewed);

      // Update the specific message
      if (indexOfUnreadMessage !== -1) {
        const updateOperation = {
          $set: {
            [`messages.${indexOfUnreadMessage}.isViewed`]: true,
          },
        };

        const updatedChat = await this.chatRepository.findOneAndUpdate(
          { _id: chat._id },
          updateOperation
        );

        res.json(updatedChat)
      }



    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  /*

  @Request,

  {
    sender:1234567,
    receiver:123456789
  }

  */

  async createChat(participants: any, res: any) {
    try {
      const { sender, receiver } = participants;

      const chatFound = await this.chatRepository.findOne({
        $and: [
          { "participants.userId": sender },
          { "participants.userId": receiver },
        ],
      })

      if (chatFound) {
        return res.json(chatFound)
      }

      const [senderDetails, recieverDetails] = await Promise.all([
        this.getUserDetails(sender),
        this.getUserDetails(receiver),
      ])

      const chat = await this.chatRepository.createPartial({
        participants: [senderDetails, recieverDetails], messages: []
      })

      res.json(chat)

    } catch (err) {
      throw new BadRequestException(err.message)
    }

  }


  async addMessage(data: any, query: any, res: any) {
    try {
      const { chatId, senderId, text } = data
      const result = await this.chatRepository.findOneAndUpdate({ _id: chatId }, {
        $push: {
          messages: { sender: senderId, content: text, timestamp: Date.now(), isViewed: false }
        }
      })

      res.json(result)
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }


  private async getUserDetails(userId: string): Promise<any> {
    const serviceURL = `${this.configService.get('USER_SERVICE_URI')}/${userId}`;
    try {
      const response = await axios.get(serviceURL)
      const res = response?.data?.data

      return {
        userId: res.userId,
        firstName: res.firstName,
        lastName: res.lastName,
        headline: res.headline,
        profileImage: res.profileImage
      };
    } catch (err) {
      throw new BadRequestException('Error Fetching user details')
    }
  }






}


