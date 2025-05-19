import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpringbootService } from './springboot.service';
import { ParentInterface } from '../interface/parent.interface';

// Import using require to avoid "not a constructor" error
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-require-imports
const TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: InstanceType<typeof TelegramBot>;
    private readonly token: string;
    private readonly isProd: boolean;
    private readonly logger = new Logger(TelegramService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly springbootService: SpringbootService,
    ) {
        const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
        this.isProd = this.configService.get<string>('PRODUCTION') === 'true';
        if (!token) {
            this.logger.error('TELEGRAM_BOT_TOKEN is not defined');
            throw new Error('TELEGRAM_BOT_TOKEN is required');
        }
        this.token = token;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
        this.bot = new TelegramBot(this.token, { polling: !this.isProd });
    }

    async onModuleInit() {
        if (this.isProd) {
            const webhookUrl = this.configService.get<string>(
                'TELEGRAM_WEBHOOK_URL',
            );
            if (!webhookUrl) {
                this.logger.error('TELEGRAM_WEBHOOK_URL is not defined');
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.bot.setWebHook(`${webhookUrl}`);
            this.logger.log(`Webhook set to ${webhookUrl}`);
        } else {
            this.setupListeners();
            this.logger.log('Polling listeners set up (dev mode)');
        }
        this.logger.log(
            `Telegram bot initialized ::: Environment: ${this.isProd ? 'Production' : 'Development'} | Token: ${this.token}`,
        );
    }

    private setupListeners(): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        this.bot.onText(/\/start/, async (msg: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            const chatId = msg.chat.id;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.bot.sendMessage(
                chatId,
                'Hi! Please enter your phone number to verify yourself.',
            );
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        this.bot.on('message', async (msg: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            if (msg.text?.match(/^(\+?60|0)1\d{8}$/)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                const chatId = msg.chat.id;

                const parent: ParentInterface =
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
                    await this.springbootService.getParentByPhone(msg.text);
                if (parent) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    parent.telegramChatId = chatId;
                    await this.springbootService.saveParent(parent);

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                    await this.bot.sendMessage(
                        chatId,
                        `You’ve been registered to ${parent.name}. We will send you updates here. Thank you!`,
                    );
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                    await this.bot.sendMessage(
                        chatId,
                        'Your phone number is not registered. Please contact the admin.',
                    );
                }
            }
        });
    }

    async sendMessage(chatId: string, text: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await this.bot.sendMessage(chatId, text);
    }

    async sendDocument(chatId: string, filePath: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await this.bot.sendDocument(chatId, filePath);
    }
}
