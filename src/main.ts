import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const isDev = process.env.NODE_ENV == 'dev';

    const corsOrigins = isDev
        ? ['http://localhost:4200']
        : [
              'https://auth.tigasatutiga.com',
              'https://tuitionez-admin-api.tigasatutiga.com',
              'https://tuitionez-admin.tigasatutiga.com',
          ];

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
