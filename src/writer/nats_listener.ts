import NATS from 'nats';
import { DataLitener } from './data_listener';
import { EventEmitter } from 'events';

export class NatsListener extends EventEmitter implements DataLitener {
  private client: NATS.Client;

  connect () {
    this.client = NATS.connect();
  }

  acceptTransferOperation () {
    process.nextTick(() => {
      this.client.subscribe('data_transfer_begin', async (data, replyTo) => {
        data = JSON.parse(data);

        this.emit('data_transfer_begin', data);

        this.client.publish(replyTo, 'true');
      });
    });
  }

  listenForTransferOperationEnd () {
    process.nextTick(() => {
      this.client.subscribe('data_transfer_end', (hash) => {
        this.emit('data_transfer_end', hash);
      });
    });
  }

  startReceivingBlocksOfData () {
    process.nextTick(() => {  
      this.on('data_block_written', (blockNumber, replyTo) => {
        this.client.publish('data_block_written', blockNumber.toString(), replyTo);
      });

      this.client.subscribe('write_data_block', async (dataBlock, replyTo) => {
        dataBlock = JSON.parse(dataBlock);
  
        this.emit('data_block_received', dataBlock, replyTo);
        
        this.client.publish(replyTo, dataBlock.blockNumber.toString());
      });
    });
  }
}
