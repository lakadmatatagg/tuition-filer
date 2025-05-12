import { Injectable } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Injectable()
export class AppService {
    constructor(private readonly telegramService: TelegramService) {}
    getHello(): string {
        return 'Hello World!';
    }
}
