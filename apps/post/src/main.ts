import { NestFactory } from '@nestjs/core';
import { PostModule } from './post.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { KafkaService } from '@app/common';
import { KafkaOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(PostModule);
  app.useGlobalPipes(new ValidationPipe());
  const kafkaService = app.get<KafkaService>(KafkaService)
  app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('POST'))
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  const configService = app.get(ConfigService)
  await app.listen(configService.get('PORT'));
  await app.startAllMicroservices();
}

bootstrap();

