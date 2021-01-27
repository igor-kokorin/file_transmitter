import { DataTransport } from './data_transport';
import NATS from 'nats';
import { DataTransferOperation } from './data_transfer_operation';
import { EventEmitter } from 'events';

export class NatsTransport extends EventEmitter implements DataTransport {
  private client: NATS.Client;
  readonly blockSizeInBytes: number;

  constructor () {
    super();

    this.blockSizeInBytes = 500000;
  }

  connect () {
    this.client = NATS.connect();
  }

  beginTransferOperation (operation: DataTransferOperation) {
    this.client.request('data_transfer_begin', JSON.stringify({ extension: operation.extension, hash: operation.hash }), (canConsume) => {
      if (JSON.parse(canConsume)) {
        this.emit('data_transfer_begin');
      }
    });
  }

  completeTransferOperation (hash: string) {
    this.client.publish('data_transfer_end', hash);
  }

  listenForDataBlockWritten () {
    this.client.subscribe('data_block_written', () => this.emit('data_block_written'));
  }

  transferBlockOfData (block: string) {
    this.client.request('write_data_block', block, { max: 1, timeout: 10000 }, async (msg) => {
      if (msg instanceof NATS.NatsError && msg.code === NATS.REQ_TIMEOUT) {
        this.emit('data_block_transfer_timeout', block);

        return;
      }
    });
  }
}
