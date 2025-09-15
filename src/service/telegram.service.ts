import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpringbootService } from './springboot.service';
import { InvoiceService } from './invoice.service';
import { Readable } from 'stream';

// Import using require to avoid "not a constructor" error
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-require-imports
const TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: InstanceType<typeof TelegramBot>;
    private readonly token: string;
    private readonly isProd: boolean;
    private readonly logger = new Logger(TelegramService.name);
    private readonly pendingVerification = new Set<string>();

    constructor(
        private readonly configService: ConfigService,
        private readonly springbootService: SpringbootService,
        private readonly invoiceService: InvoiceService,
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
        this.bot.on('message', async (msg: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            const chatId = msg.chat.id;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            const text = msg.text?.trim();

            if (!text) return;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            await this.handleMessage(chatId, text);
        });
    }

    async sendMessage(chatId: string, text: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await this.bot.sendMessage(chatId, text);
    }

    async sendDocument(chatId: string, file: Buffer): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await this.bot.sendDocument(chatId, file);
    }

    async processUpdate(update: any): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        const msg = update.message;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!msg || !msg.chat || !msg.text) return;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        const chatId = msg.chat.id;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        const text = msg.text;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.handleMessage(chatId, text);
    }

    private async handleMessage(chatId: string, text: string): Promise<void> {
        if (text === '/start') {
            const existingParent =
                await this.springbootService.getParentByTelegram(chatId);
            if (existingParent) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                await this.bot.sendMessage(
                    chatId,
                    `Hi ${existingParent.name}, you are already registered. We’ll continue sending you updates here.`,
                );
            } else {
                this.pendingVerification.add(chatId);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                await this.bot.sendMessage(
                    chatId,
                    'Hi! Please enter your phone number to verify yourself.',
                );
            }
            return;
        }

        if (text === '/require_invoice') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.bot.sendMessage(
                chatId,
                'Please wait... Generating invoice.',
            );
            const attachment =
                await this.invoiceService.getInvoiceCurrentMonth(chatId);
            if (attachment.buffer) {
                const fileStream = Readable.from(attachment.buffer);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                fileStream.path = `${attachment.invoiceNo}.pdf`;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                await this.bot.sendDocument(chatId, fileStream);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                await this.bot.sendMessage(
                    chatId,
                    'Here is your invoice for this month. Thank you for your support!',
                );
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                await this.bot.sendMessage(
                    chatId,
                    'Could not generate invoice, please contact administrator.',
                );
            }
            return;
        }

        if (text === '/status') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.bot.sendMessage(
                chatId,
                'You are subscribed to notifications.',
            );
            return;
        }

        if (/^(\+?60|0)1(1\d{7,8}|[02-9]\d{7,8})$/.test(text)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            if (!this.pendingVerification.has(chatId)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                await this.bot.sendMessage(
                    chatId,
                    'Please type /start to begin the registration process.',
                );
                return;
            }

            const parent = await this.springbootService.getParentByPhone(text);
            if (parent) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
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
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await this.bot.sendMessage(
            chatId,
            'Unrecognized command or message. Type /help for available options.',
        );
    }
}
