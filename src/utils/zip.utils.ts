import * as archiver from 'archiver';
import { PassThrough } from 'stream';

export async function zipBuffers(
    files: { filename: string; buffer: Buffer }[],
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const archive = archiver('zip', { zlib: { level: 9 } });
        const stream = new PassThrough();
        const chunks: Buffer[] = [];

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => reject(err));

        archive.pipe(stream);

        for (const file of files) {
            archive.append(file.buffer, { name: file.filename });
        }

        archive.finalize();
    });
}
