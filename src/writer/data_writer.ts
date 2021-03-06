import * as fs from 'fs';
import * as path from 'path';
import { DataBlock } from './data_block';
import { EventEmitter } from 'events';
import { DataTransferOperation } from './data_transfer_operation';

export class DataWriter extends EventEmitter {
  private fileHandle: fs.promises.FileHandle;
  private filesDir: string;
  private filePath: string;

  constructor (filesDir: string) {
    if (!filesDir) {
      throw new Error('filesDir is required');
    }

    super();

    this.filesDir = filesDir;
  }

  async init (operation: DataTransferOperation) {
    this.filePath = path.join(this.filesDir, operation.extension ? `${operation.hash}.${operation.extension}` : operation.hash)

    this.fileHandle = await fs.promises.open(this.filePath, 'w');
  }

  async close () {
    if (this.fileHandle) {
      await this.fileHandle.close();
    }
  }

  writeBlock (block: DataBlock, receiver: string) {
    fs.write(this.fileHandle.fd, Buffer.from(block.block, 'base64'), 0, null, block.offset, (err) => {
      if (err) {
        return;
      }

      this.emit('data_block_written', block.blockNumber, receiver);
    });
  }
}
