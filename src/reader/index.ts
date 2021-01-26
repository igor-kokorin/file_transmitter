import { DataReader } from './data_reader';
import { DataTransferOperation } from './data_transfer_operation';
import { DataTransmitter } from './data_transmitter';
import { NatsTransport } from './nats_transport';
import * as path from 'path';
import { OperationStore } from './operation_store';
import { WsTransport } from './ws_transport';

(async () => {
  //const transport = new NatsTransport();
  const transport = new WsTransport();

  const filePath = path.join(__dirname, 'files', '1GB.bin')

  const op = await DataTransferOperation.create(filePath, transport);

  const reader = new DataReader();

  const opStore = new OperationStore(op);

  const transmitter = new DataTransmitter(reader, transport, opStore);

  await transmitter.transmit(op);
})();
