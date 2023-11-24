import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@app/common';
import { KafkaOptions } from '@nestjs/microservices'
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common'
import { Neo4jTypeInterceptor } from './neo4j/neo4j-type.interceptor';
import { Neo4jErrorFilter } from './neo4j/neo4j-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
  app.useGlobalPipes(new ValidationPipe())
  const kafkaService = app.get<KafkaService>(KafkaService)
  app.connectMicroservice<KafkaOptions>(kafkaService.getOptions('USER'))
  app.useGlobalPipes(new ValidationPipe());
  // app.useGlobalInterceptors(new Neo4jTypeInterceptor())
  app.useGlobalFilters(new Neo4jErrorFilter());
  app.enableCors();
  const configService = app.get(ConfigService)
  await app.startAllMicroservices();
  await app.listen(configService.get('PORT'));
}

bootstrap();



