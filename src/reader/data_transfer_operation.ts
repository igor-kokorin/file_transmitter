import * as fs from 'fs';
import * as crypto from 'crypto';
import { DataTransport } from './data_transport';
import * as path from 'path';

export class DataTransferOperation {
  hash: string;
  extension: string;
  sizeInBytes: number;
  blockSizeInBytes: number;
  blocksCount: number;
  fullPath: string;

  private constructor (opts: DataTransferOperation) {
    this.hash = opts.hash;
    this.sizeInBytes = opts.sizeInBytes;
    this.blockSizeInBytes = opts.blockSizeInBytes;
    this.blocksCount = opts.blocksCount;
    this.fullPath = opts.fullPath;
    this.extension = opts.extension;
  }

  static async create (fullPath: string, transport: DataTransport) {
    if (!fullPath) {
      throw new Error('fullPath is required');
    }

    if (!transport) {
      throw new Error('transport is required');
    }

    const { size: sizeInBytes } = await fs.promises.stat(fullPath);

    const md5 = crypto.createHash('sha1');
    
    const hash = md5.update(fullPath).digest('hex');

    return new DataTransferOperation({
      fullPath,
      hash,
      sizeInBytes,
      extension: path.extname(fullPath).split('.')[1] || null,
      blockSizeInBytes: transport.blockSizeInBytes,
      blocksCount: Math.ceil(sizeInBytes / transport.blockSizeInBytes)
    });
  }
};