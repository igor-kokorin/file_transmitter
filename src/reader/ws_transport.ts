import { DataTransport } from './data_transport';
import WebSocket from 'ws';
import { DataTransferOperation } from './data_transfer_operation';
import { EventEmitter } from 'events';

export class WsTransport extends EventEmitter implements DataTransport {
  private client: any;
  readonly blockSizeInBytes: number;
  private blocksTimers: object;

  constructor () {
    super();

    this.blockSizeInBytes = 500000;
    this.blocksTimers = {};
  }

  connect () {
    this.client = new WebSocket('ws://localhost:8080');

    this.client.on('open', () => console.log('Connected'));

    this.client.on('message', (message) => {
      this.parseMessage(message);
    });
  }

  private parseMessage (message: string) {
    const parsedMessage = JSON.parse(message);

    this.emit(parsedMessage.event, parsedMessage.data);
  }

  beginTransferOperation (operation: DataTransferOperation) {
    this.client.send(
      JSON.stringify({
        event: 'ws:data_transfer_begin',
        data: { extension: operation.extension, hash: operation.hash }
      })
    );
    
    this.on('ws:allow_data_transfer', () => {
      this.emit('data_transfer_begin');
    });
  }

  completeTransferOperation (hash: string) {
    this.client.send(
      JSON.stringify({
        event: 'ws:data_transfer_end',
        data: { hash }
      })
    );
  }

  listenForDataBlockWritten () {
    this.on('ws:data_block_accepted', (data) => {
      clearTimeout(this.blocksTimers[data.blockNumber]);
    });

    this.on('ws:data_block_written', () => {
      this.emit('data_block_written');
    });
  }

  transferBlockOfData (block: string) {
    const blockParsed = JSON.parse(block);

    this.blocksTimers[blockParsed.blockNumber] = setTimeout(() => {
      this.emit('data_block_transfer_timeout', block);
    }, 10000);

    this.client.send(
      JSON.stringify({
        event: 'ws:write_data_block',
        data: blockParsed
      })
    );
  }
}
