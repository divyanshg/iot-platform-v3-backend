import * as cookieParser from 'cookie-parser';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:5173', 
    'http://172.16.3.76:5173', 
    'http://192.168.1.4:5173'
  ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('MRIIC IoT Platform')
    .setVersion('1.0')
    .addTag('iot')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
