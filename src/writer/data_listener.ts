import { EventEmitter } from 'events';

export interface DataLitener extends EventEmitter {
  connect();

  acceptTransferOperation();

  startReceivingBlocksOfData();

  listenForTransferOperationEnd();
};