import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ParentInterface } from '../interface/parent.interface';
import { SystemSettingInterface } from '../interface/system-setting.interface';
import { ReferenceDataInterface } from '../interface/configuration/reference-data.interface';
import { StudentInterface } from '../interface/student.interface';

@Injectable()
export class SpringbootService {
    private readonly logger = new Logger(SpringbootService.name);
    private readonly springbootUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.springbootUrl = this.configService.get<string>('BACKEND_URL')!;
        if (!this.springbootUrl) {
            this.logger.error('BACKEND_URL is not defined');
        }
        this.logger.log(`Loaded Springboot URL: ${this.springbootUrl}`);
    }

    async getParentByPhone(phoneNo: string): Promise<ParentInterface> {
        const url = `${this.springbootUrl}/parent/get-by-phone/${encodeURIComponent(phoneNo)}`;

        try {
            const response = await axios.get<ParentInterface>(url);
            return response.data;
        } catch (error) {
            this.logger.error(
                `Failed to fetch parent by phone ${phoneNo}`,
                error,
            );
            throw error;
        }
    }

    async getParentByTelegram(chatId: number): Promise<ParentInterface> {
        const url = `${this.springbootUrl}/parent/get-by-telegram/${encodeURIComponent(chatId)}`;

        try {
            const response = await axios.get<ParentInterface>(url);
            return response.data;
        } catch (error) {
            this.logger.error(
                `Failed to fetch parent by telegram chat id ${chatId}`,
                error,
            );
            throw error;
        }
    }

    async saveParent(parent: ParentInterface): Promise<any> {
        const url = `${this.springbootUrl}/parent/save`;

        try {
            return await axios.post(url, parent);
        } catch (error) {
            this.logger.error(`Failed to save parent`, error);
            throw error;
        }
    }

    async getInvoiceFileName(key: string): Promise<SystemSettingInterface> {
        const url = `${this.springbootUrl}/system-setting/by-key/${key}`;

        try {
            const response = await axios.get<SystemSettingInterface>(url);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch setting by key ${key}`, error);
            throw error;
        }
    }

    async getStudentListByParentChatId(
        chatId: string,
    ): Promise<StudentInterface[]> {
        const url = `${this.springbootUrl}/student/list-by-parent-telegram/${chatId}`;

        try {
            const response = await axios.get<StudentInterface[]>(url);
            return response.data;
        } catch (error) {
            this.logger.error(
                `Failed to fetch student list by parent chat ID ${chatId}`,
                error,
            );
            throw error;
        }
    }

    async getReferenceByGroup(
        group: string,
    ): Promise<ReferenceDataInterface[]> {
        const url = `${this.springbootUrl}/config/reference-code/list/${group}`;

        try {
            const response = await axios.get<ReferenceDataInterface[]>(url);
            return response.data;
        } catch (error) {
            this.logger.error(
                `Failed to fetch reference by group ${group}`,
                error,
            );
            throw error;
        }
    }
}
