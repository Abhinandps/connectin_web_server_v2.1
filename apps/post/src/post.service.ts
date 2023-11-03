import { AUTH_SERVICE, HASHTAG_FOLLOWS, HASHTAG_UNFOLLOWS, NEW_POST, NEW_POSTS } from '@app/common';
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
import { HashTag } from './schemas/hashTag.schema';
import { USER_SERVICE } from './constant/services';

@Injectable()
export class PostService {

  constructor(
    @Inject(AUTH_SERVICE) private authClient: ClientKafka,
    @Inject(USER_SERVICE) private userClient: ClientKafka,
    private readonly configService: ConfigService,
    private readonly postRepository: PostRepository,
    private readonly hashTagRepository: HashTagRepository
  ) { }


  getHello(): string {
    return 'Hello World!';
  }


  async getPost(postId: string, res: any) {
    try {
      // 1. find the post by post id 
      const post = await this.postRepository.findOne({ _id: postId })

      if (!post) {
        // Handle the case where the post with the given ID doesn't exist.
        throw new NotFoundException('Post not found');
      }

      res.status(200).json({
        data: post
      })
    } catch (err) {
      throw new BadRequestException(err)
    }
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
      })

      const hashtagsInContent = contentBody.match(/#\w+/g);


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
            const newHashtag = await this.hashTagRepository.createPartial({
              name: hashtagText,
              posts: [response._id.toString()],
              creator: _id,
            });
          }
        }
      }

      // 4. create an event to store in user feed

      const data = {
        postId: response._id,
        userId: _id
      }

      await this.userClient.emit(NEW_POST, data)

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

      const { text }: any = request

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
        content: text,
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

  // report a post
  async reportPost(postId: string, request: any, { _id }: any, res: any) {
    try {
      const serviceURL = `${this.configService.get('REPORT_SERVICE_URI')}/${postId}/report`;

      const response = await axios({
        method: 'POST',
        url: serviceURL,
        data: request,
        withCredentials: true
      });

    } catch (err) {
      throw new BadRequestException(err)
    }
  }




  async incrementHashTagFollowerCount(userId: string, hashtag: string, res: any) {
    try {
      const updatedHashTag = `#${hashtag}`
      const existingHashTag = await this.hashTagRepository.findOne({ name: updatedHashTag })

      if (!existingHashTag) {
        throw new BadRequestException('hash tag not found')
      }

      let updateQuery: Partial<HashTag> = {};

      updateQuery.followers = (updateQuery.followers || 0) + 1

      await this.hashTagRepository.findOneAndUpdate({ name: updatedHashTag }, updateQuery)

      const latestPostIds = await this.fetchLatestProductFromHashtag(existingHashTag.posts)

      if (latestPostIds.length > 0) {

        const data = {
          postIds: latestPostIds,
          userId: userId
        }

        await this.userClient.emit(HASHTAG_FOLLOWS, data)
      }

      res.status(200).json({
        message: `Followed count : ${existingHashTag.followers}`,
      });


    } catch (err) {
      throw new BadRequestException(err)
    }
  }


  async decrementHashTagFollowerCount(userId: string, hashtag: string, res: any) {
    try {
      const updatedHashTag = `#${hashtag}`
      const existingHashTag = await this.hashTagRepository.findOne({ name: updatedHashTag })

      if (!existingHashTag) {
        throw new BadRequestException('hash tag not found')
      }

      const postIdsOfHashTag = await this.fetchPostsIdsInHashTag(updatedHashTag)

      const data = {
        postIds: postIdsOfHashTag,
        userId: userId
      }

      let updateQuery: Partial<HashTag> = { followers: existingHashTag.followers };

      if (updateQuery.followers > 0) {
        updateQuery.followers = updateQuery.followers - 1
        console.log('hitted')
        await this.userClient.emit(HASHTAG_UNFOLLOWS, data)
      } else {
        updateQuery.followers = 0
      }


      await this.hashTagRepository.findOneAndUpdate({ name: updatedHashTag }, updateQuery)



      res.status(200).json({
        message: `Followed count : ${existingHashTag.followers}`,
      });


    } catch (err) {
      throw new BadRequestException(err)
    }
  }






  // request to fetch the latest posts from hashtags

  private async fetchLatestProductFromHashtag(postIds: any) {
    const posts = await this.postRepository.find({ _id: { $in: postIds } })

    posts.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
    const latestPosts = posts.slice(0, 5);

    const latestPostIds = latestPosts.map((post) => post._id.toString());

    return latestPostIds
  }

  // remove data from feed when unfollow hashtag

  private async fetchPostsIdsInHashTag(hashTag: string) {
    const hash_Tag = await this.hashTagRepository.findAll({ name: hashTag })
    return hash_Tag[0].posts
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
