import { AUTH_SERVICE } from '@app/common';
import { Injectable, Inject, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { CreatePostDto } from './dto/post.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PostRepository } from './posts.repsitory';
import { Post } from './schemas/posts.schema';
import { HashTagRepository } from './hashTags.repository';
import { SaveOptions } from 'mongoose';
import { repl } from '@nestjs/core';

@Injectable()
export class PostService {

  constructor(
    @Inject(AUTH_SERVICE) private authClient: ClientKafka,
    private readonly configService: ConfigService,
    private readonly postRepository: PostRepository,
    private readonly hashTagRepository: HashTagRepository
  ) { }


  getHello(): string {
    return 'Hello World!';
  }

  async createPost(request: CreatePostDto, files: any, { _id }: any, res: any) {

    try {

      const { contentType, title, contentBody } = request

      // 1.fetch user data from user service based on _id
      const { firstName, lastName, profileImage, headline } = await this.getUserData(_id)

      // 2. create post based on request
      const response = await this.postRepository.create({
        ...request,
        creator: {
          userId: _id,
          firstName: firstName && firstName,
          lastName: lastName && lastName,
          profileImage: profileImage && profileImage,
          headline: headline && headline
        },
        contentType,
        title,
        contentBody,
        attachments: files,
        comments: [],
        likes: [],
        save: function (options: SaveOptions) {
          throw new Error('Function not implemented.');
        }
      })

      const hashtagsInContent = contentBody.match(/#\w+/g);

      console.log(hashtagsInContent)

      // 3. find hash tag if it contais in content body and attach post to it

      if (hashtagsInContent && hashtagsInContent.length > 0) {
        for (const hashtagText of hashtagsInContent) {
          const existingHashtag = await this.hashTagRepository.findOne({ name: hashtagText });

          if (existingHashtag) {
            await this.hashTagRepository.findOneAndUpdate({ _id: existingHashtag._id }, {
              $push: { posts: response._id }
            })
          } else {
            // 4. that hashtag not present in then create newone and attach post to it
            const newHashtag = await this.hashTagRepository.create({
              name: hashtagText,
              posts: [response._id.toString()],
              creator: _id,
              save: function (options: SaveOptions) {
                throw new Error('Function not implemented.');
              }
            });
          }
        }
      }

      res.status(200).json({
        data: response
      })
    } catch (error) {
      throw new BadRequestException(error)
    }

  }


  async editPost(postId: string, request: any, { _id }: any, res: any) {
    try {
      // 1. find the post by post id 
      const post = await this.postRepository.findOne({ _id: postId })


      if (!post) {
        // Handle the case where the post with the given ID doesn't exist.
        throw new NotFoundException('Post not found');
      }

      // 2. compiring the _id in the request with userId stored in the post.
      const user_id = post.creator.userId

      if (user_id !== _id) {
        throw new UnauthorizedException('Unauthorized to edit this post')
      }
      // 3. if they match process with update
      const updates: Partial<Post> = {};

      if (request.title) {
        updates.title = request.title
      }

      if (request.contentBody) {
        const oldContent = post.contentBody;

        // remove
        await this.removeHashtagsFromPost.call(this, oldContent, postId);

        updates.contentBody = request.contentBody

        // add
        await this.addHashtagsToPost.call(this, request.contentBody, postId)
      }

      await this.postRepository.findOneAndUpdate({ _id: postId }, updates)

      res.status(200).json({
        message: 'Post updated successfully',
      });

    } catch (err) {
      throw new BadRequestException(err);
    }
  }


  async deletePost(postId: string, request: any, { _id }: any, res: any) {
    try {
      // 1. find the post by post id 
      const post = await this.postRepository.findOne({ _id: postId })


      if (!post) {
        // Handle the case where the post with the given ID doesn't exist.
        throw new NotFoundException('Post not found');
      }

      // 2. compiring the _id in the request with userId stored in the post.
      const user_id = post.creator.userId

      if (user_id !== _id) { // TODO:role chechs to delete include later
        throw new UnauthorizedException('Unauthorized to edit this post')
      }

      // 3. if they match process with Delete

      const oldContent = post.contentBody;

      // remove the post from all tags
      await this.removeHashtagsFromPost.call(this, oldContent, postId);

      await this.postRepository.findOneAndRemove({ _id: postId })

      res.status(200).json({
        message: 'Post deleted successfully',
      });

    } catch (err) {
      throw new BadRequestException(err);
    }
  }


  async toggleLikeToPost(postId: string, { _id }: any, res: any) {
    // 1. check if the post with that postId exist
    const post = await this.postRepository.findOne({ _id: postId })
    if (!post) {
      // Handle the case where the post with the given ID doesn't exist.
      throw new NotFoundException('Post not found');
    }

    // 1.fetch user data from user service based on _id
    const { firstName, lastName, profileImage } = await this.getUserData(_id)

    const updates: Partial<Post> = { likes: [] };

    // Check if the user has already liked the post
    const userLiked = post.likes.some(like => like.creator.userId === _id);


    // 2. add user like to post in db or updating the likes count
    if (userLiked) {
      updates.likes = post.likes.filter((item: any) => item.creator.userId !== _id)
    } else {
      const newLike: any = {
        creator: {
          userId: _id,
          firstName,
          lastName,
          profileImage
        }
      }
      updates.likes.push(newLike)
    }

    // console.log(updates)

    await this.postRepository.findOneAndUpdate({ _id: postId }, updates)


    // 3. send response to client

    res.status(200).json({
      message: `Post ${userLiked ? 'unliked' : 'liked'} successfully`,
    });
  }


  async createComments(postId: string, request: string, { _id }: any, res: any) {
    try {
      const { text }: any = request
      // 1.fetch user data from user service based on _id
      const { firstName, lastName, profileImage, headline } = await this.getUserData(_id)


      // 2. create a comment
      const customCommentId = this.generateCustomCommentId();
      const comment: any = {
        _id: customCommentId,
        creator: {
          userId: _id,
          firstName,
          lastName,
          profileImage,
          headline
        },
        content: text,
        likes: 0
      }

      const updateQuery = {
        $push: { comments: comment }
      };


      await this.postRepository.findOneAndUpdate({ _id: postId }, updateQuery)

      res.status(200).json({
        message: `Post comment added successfully`,
      });


    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async createCommentsReply(postId: string, commentId: string, request: string, { _id }: any, res: any) {
    try {

      // 1.fetch user data from user service based on _id
      const { firstName, lastName, profileImage, headline } = await this.getUserData(_id)
      // 2. find the post
      const post = await this.postRepository.findOne({ _id: postId })

      if (!post) {
        // Handle the case where the post with the given ID doesn't exist.
        throw new NotFoundException('Post not found');
      }

      // find the user is planned to self reply throw exception
      // if (post.creator.userId === _id) {
      //   throw new BadRequestException('Reply to your self not allowed')
      // }

      // 3. Check if the parent comment exists
      const parentComment = post.comments.find((comment) => comment._id === commentId);

      if (!parentComment) {
        // Handle the case where the parent comment with the given ID doesn't exist.
        throw new NotFoundException('Parent comment not found');
      }

      // 4. Create the reply document
      const customCommentId = this.generateCustomCommentId();
      const reply: any = {
        _id: customCommentId,
        creator: {
          userId: _id,
          firstName,
          lastName,
          profileImage,
          headline
        },
        content: request,
        likes: 0
      }

      // 5.  Add the reply to the parent comment's replies array

      parentComment.replies.push(reply)

      // 6. Update the post with the new reply
      await this.postRepository.findOneAndUpdate({ _id: postId }, {
        $set: { comments: post.comments }
      });

      res.status(200).json({
        message: `Reply comment added successfully`,
      });


    } catch (err) {
      throw new BadRequestException(err)
    }

  }



  // fetch the user details
  private async getUserData(user_id: string) {
    try {
      const serviceURL = `${this.configService.get('USER_SERVICE_URI')}/${user_id}`;

      const response = await axios({
        method: 'GET',
        url: serviceURL,
        withCredentials: true
      });

      const { data } = response.data
      const { firstName, lastName, profileImage, headline } = data

      return { firstName, lastName, profileImage, headline }

    } catch (error) {
      throw new BadRequestException(error)
    }
  }


  // hashtag manaement
  private async removeHashtagsFromPost(content: string, postId: string) {
    // Extract hashtags from the old content
    const oldHashtags = content.match(/#\w+/g) || [];

    // Update the hashtags
    for (const hashtagText of oldHashtags) {
      await this.hashTagRepository.findOneAndUpdate(
        { name: hashtagText },
        { $pull: { posts: postId } },
      );
    }
  }


  private async addHashtagsToPost(content: string, postId: string) {
    // Extract hashtags from the content
    const newHashtags = content.match(/#\w+/g) || [];

    // Update the hashtags
    for (const hashtagText of newHashtags) {
      await this.hashTagRepository.findOneAndUpdate(
        { name: hashtagText },
        { $push: { posts: postId } },
      );
    }
  }

  private generateCustomCommentId() {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000000);

    // Combine the timestamp and random number to create a custom ID
    const customCommentId = `${timestamp}-${randomSuffix}`;

    return customCommentId;
  }





  // async getUserData(_id: string) {

  // }








  async test(message) {
    const res = await this.authClient.send('test-kafka-topic', message).toPromise();
    return console.log(res, 'from auth service');

  }



  // async uploadFiles(files: Express.Multer.File[]) {
  //   const uploadedUrls = [];

  //   for (const file of files) {
  //     const result = await this.cloudinaryStorage.upload(file.path); // Use the configured storage
  //     uploadedUrls.push(result.secure_url);
  //   }

  //   return uploadedUrls;
  // }

}
