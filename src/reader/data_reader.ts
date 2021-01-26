
import { EventEmitter } from 'events';
import { DataTransferOperation } from './data_transfer_operation';
import * as fs from 'fs';
import { DataBlock } from './data_block';

export class DataReader extends EventEmitter {
  private readStream: fs.ReadStream;

  public read (operation: DataTransferOperation) {
    this.readStream = fs.createReadStream(operation.fullPath, {
      highWaterMark: operation.blockSizeInBytes
    });

    process.nextTick(() => {
      let blockNumber = 1;
      let offset = 0;

      this.readStream.on('data', async (data: Buffer) => {
        this.emit('data_block', <DataBlock>{
          block: data.toString('base64'),
          hash: operation.hash,
          sizeInBytes: operation.sizeInBytes,
          offset,
          blockNumber
        });
  
        offset += operation.blockSizeInBytes;
        blockNumber += 1;
      });

      this.readStream.on('end', () => {
        this.emit('file_end');
      });
    })
  }
}