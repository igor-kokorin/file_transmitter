import { DataTransferOperation } from './data_transfer_operation';
import { EventEmitter } from 'events';

export interface DataTransport extends EventEmitter {
  readonly blockSizeInBytes;

  connect();

  beginTransferOperation(operation: DataTransferOperation);

  completeTransferOperation(hash: string);

  transferBlockOfData(block: string);

  listenForDataBlockWritten();
};
