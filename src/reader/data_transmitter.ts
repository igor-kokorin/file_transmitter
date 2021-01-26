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
    console.log(`Started transmitting file ${operation.fullPath}`);

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

    this.transport.on('data_block_written', async () => {
      const remainingBlocks = await this.operationStore.decrementBlocksCount();

      console.log(`read ${(((operation.blocksCount - remainingBlocks) / operation.blocksCount) * 100).toFixed(2)}% of blocks (total blocks = ${operation.blocksCount}, block size = ${operation.blockSizeInBytes})`);

      if (remainingBlocks === 0) {
        this.transport.completeTransferOperation(operation.hash);
      }
    });

    this.transport.on('data_block_transfer_timeout', async (block) => {
      console.log('block timed out');
      await this.operationStore.enqueueBlock(block);
    });

    this.transport.listenForDataBlockWritten();

    while (true) {
      const block = await this.operationStore.dequeueBlock();

      if (!block) {
        continue;
      }

      this.transport.transferBlockOfData(block);

      const remainingBlocks = await this.operationStore.getBlocksCount();

      if (remainingBlocks === 0) {
        break;
      }
    }
  }
}
