import { DataLitener } from './data_listener';
import { DataWriter } from './data_writer';

export class DataReceiver {
  writer: DataWriter;
  listener: DataLitener;

  constructor (writer: DataWriter, listener: DataLitener) {
    if (!writer) {
      throw new Error('writer is required');
    }

    if (!listener) {
      throw new Error('listener is required');
    }

    this.writer = writer;
    this.listener = listener;
  }

  public async receive () {
    console.log('Started listening for incoming file');

    this.listener.connect();

    this.listener.on('data_transfer_begin', async (data) => {
      await this.writer.init(data);

      console.log(`Start receiving data for ${data.hash}`);

      this.listener.startReceivingBlocksOfData();
      this.listener.listenForTransferOperationEnd();
    });

    this.writer.on('data_block_written', (blockNumber, replyTo) => {
      this.listener.emit('data_block_written', blockNumber, replyTo);
    });

    this.listener.on('data_block_received', (block, replyTo) => {
      this.writer.writeBlock(block, replyTo);
    });

    this.listener.on('data_transfer_end', async (hash) => {
      console.log(`End receiving data for ${hash}`);

      await this.writer.close();
    });

    this.listener.acceptTransferOperation();
  }
}
