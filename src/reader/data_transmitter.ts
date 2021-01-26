import { DataReader } from './data_reader';
import { DataTransferOperation } from './data_transfer_operation';
import { DataTransport } from './data_transport';
import { OperationStore } from './operation_store';

export class DataTransmitter {
  reader: DataReader;
  transport: DataTransport;
  operationStore: OperationStore;

  constructor (reader: DataReader, transport: DataTransport, operationStore: OperationStore) {
    if (!reader) {
      throw new Error('reader is required');
    }

    if (!transport) {
      throw new Error('transport is required');
    }

    if (!operationStore) {
      throw new Error('operationStore is required');
    }

    this.reader = reader;
    this.operationStore = operationStore;
    this.transport = transport;
  }

  public async transmit (operation: DataTransferOperation) {
    this.transport.connect();

    await this.operationStore.init();

    this.transport.on('data_transfer_begin', () => {
      this.reader.read(operation);
    });

    this.transport.beginTransferOperation(operation);

    let offset = 0;

    this.reader.on('data_block', async (block) => {
      await this.operationStore.enqueueBlock(block);

      offset += block.offset;
    });

    this.transport.on('data_block_transfered', async () => {
      await this.operationStore.decrementBlocksCount();
    });

    this.transport.on('data_block_transfer_timeout', async (block) => {
      //await this.operationStore.enqueueBlock(block);
    });

    while (true) {
      const block = await this.operationStore.dequeueBlock();
      const len = await this.operationStore.queueLength();

      if (!block) {
        continue;
      }

      this.transport.transferBlockOfData(block);

      const remainingBlocks = await this.operationStore.getBlocksCount();

      if (remainingBlocks === 0) {
        this.transport.completeTransferOperation(operation.hash);

        break;
      }
    }
  }
}
