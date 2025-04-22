import {
  Controller,
  Get,
  Query,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { BrowserService } from '../service/browser.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { extname } from 'path';
import * as path from 'node:path';

@Controller('browser')
export class BrowserController {
  constructor(private readonly browserService: BrowserService) {}

  @Get('list')
  async showContents(): Promise<any> {
    return this.browserService.showContents();
  }

  @Delete('delete')
  async deleteFile(@Query('path') path: string): Promise<string> {
    return this.browserService.deleteFile(path);
  }

  @Get('download')
  async downloadFile(
    @Query('path') path: string,
    @Res() res: Response,
  ): Promise<void> {
    const fileBuffer = await this.browserService.downloadFile(path);
    const fileName = path.split('/').pop();
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(fileBuffer);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, file.originalname); // 👈 keep original filename
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const targetPath = path.join('', file.originalname); // 👈 import 'path' from 'path'
    return this.browserService.uploadFile(file.path, targetPath);
  }

}
