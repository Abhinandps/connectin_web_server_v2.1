import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser'
import { KafkaOptions, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { KafkaService } from '@app/common';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const kafkaService = app.get<KafkaService>(KafkaService)
  app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('AUTH'));
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
}

bootstrap();


// app.enableCors({
//   origin: 'http://localhost:3000',
//   credentials: true,
// });


// app.use('/', createProxyMiddleware({
//   target: 'http://localhost:3000',
//   changeOrigin: true
// }));
// app.use('/auth', createProxyMiddleware({
//   target: 'http://localhost:3001',
//   changeOrigin: true
// }));