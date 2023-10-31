import { AUTH_SERVICE } from '@app/common';
import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class PostService {

  constructor(
    @Inject(AUTH_SERVICE) private authClient: ClientKafka,
  ) { }


  getHello(): string {
    return 'Hello World!';
  }


  async createPost(files: any) {
    console.log(files);
  }

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
