import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from '../service/telegram.service';

@Controller('telegram')
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) {}

    @Post('webhook')
    async handleUpdate(@Body() update: any): Promise<void> {
        await this.telegramService.processUpdate(update);
    }
}
