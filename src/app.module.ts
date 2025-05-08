import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './controller/app.controller';
import { AppService } from './service/app.service';
import { BrowserController } from './controller/browser.controller';
import { BrowserService } from './service/browser.service';
import { GenerateController } from './controller/generate.controller';
import { DocxtempleterService } from './service/docxtempleter.service';

const envImport = ConfigModule.forRoot({
    envFilePath: [
        `./environments/.env.${process.env.NODE_ENV}`, // Load specific file based on NODE_ENV
        './environments/.env', // Fallback to the default .env
    ],
    isGlobal: true, // Make ConfigModule globally available
});

@Module({
    imports: [envImport],
    controllers: [AppController, BrowserController, GenerateController],
    providers: [AppService, BrowserService, DocxtempleterService],
})
export class AppModule {}
