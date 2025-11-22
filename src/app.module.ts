import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './controller/app.controller';
import { AppService } from './service/app.service';
import { BrowserController } from './controller/browser.controller';
import { BrowserService } from './service/browser.service';
import { GenerateController } from './controller/generate.controller';
import { DocxtempleterService } from './service/docxtempleter.service';
import { GoogleDocsService } from './service/google-docs.service';
import { TelegramService } from './service/telegram.service';
import { SpringbootService } from './service/springboot.service';
import { TelegramController } from './controller/telegram.controller';
import { InvoiceService } from './service/invoice.service';
import { EmailService } from './service/email.service';

const envImport = ConfigModule.forRoot({
    envFilePath: [
        `./environments/.env.${process.env.NODE_ENV}`, // Load specific file based on NODE_ENV
        './environments/.env', // Fallback to the default .env
    ],
    isGlobal: true, // Make ConfigModule globally available
});

@Module({
    imports: [envImport],
    controllers: [
        AppController,
        BrowserController,
        GenerateController,
        TelegramController,
    ],
    providers: [
        AppService,
        BrowserService,
        DocxtempleterService,
        GoogleDocsService,
        TelegramService,
        SpringbootService,
        InvoiceService,
        EmailService,
    ],
})
export class AppModule {}
