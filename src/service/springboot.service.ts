import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ParentInterface } from '../interface/parent.interface';

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

    async saveParent(parent: ParentInterface): Promise<any> {
        const url = `${this.springbootUrl}/parent/save`;

        try {
            return await axios.post(url, parent);
        } catch (error) {
            this.logger.error(`Failed to save parent`, error);
            throw error;
        }
    }
}
