import WebSocket from 'ws';
import * as http from 'http';
import { DataLitener } from './data_listener';
import { EventEmitter } from 'events';

export class WsListener extends EventEmitter implements DataLitener {
  private server: any;

  connect () {
    const server = http.createServer();

    this.server = new WebSocket.Server({ server });

    this.server.on('connection', (client) => {
      client.on('message', (message) => {
        this.parseMessage(message, client);
      });
    });

    server.listen(8080);
  }

  private parseMessage (message: string, client: any) {
    const parsedMessage = JSON.parse(message);

    this.emit(parsedMessage.event, parsedMessage.data, client)
  }

  acceptTransferOperation () {
    this.on('ws:data_transfer_begin', async (data, ws) => {
      this.emit('data_transfer_begin', data);

      ws.send(
        JSON.stringify({
          event: 'ws:allow_data_transfer'
        })
      );
    });
  }

  listenForTransferOperationEnd () {
    this.on('ws:data_transfer_end', async (data) => {
      this.emit('data_transfer_end', data.hash);;
    });
  }

  startReceivingBlocksOfData () {
    this.on('data_block_written', (blockNumber, ws) => {
      ws.send(
        JSON.stringify({
          event: 'ws:data_block_written',
          data: { blockNumber }
        })
      );
    });

    this.on('ws:write_data_block', async (dataBlock, ws) => {
      this.emit('data_block_received', dataBlock, ws);
      
      ws.send(
        JSON.stringify({
          event: 'ws:data_block_accepted',
          data: { blockNumber: dataBlock.blockNumber }
        })
      );
    });
  }
}
