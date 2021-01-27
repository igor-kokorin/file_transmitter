import { OperationStore } from '../operation_store';
import { NatsTransport } from '../nats_transport';
import { DataReader } from '../data_reader';
import { DataTransmitter } from '../data_transmitter';
import { DataTransferOperation } from '../data_transfer_operation';
import { DataTransport } from '../data_transport';

jest.mock('../operation_store');
jest.mock('../nats_transport');
jest.mock('../data_reader');

interface TestContext {
  reader: DataReader;
  op: DataTransferOperation;
  opStore: OperationStore;
  transport: DataTransport;
  transmitter: DataTransmitter;
}

async function prepareTestContext (): Promise<TestContext> {
  const transport = new NatsTransport();

  const op: DataTransferOperation = {
    blockSizeInBytes: 1,
    blocksCount: 100,
    extension: 'csv',
    fullPath: '/path/to/a/file',
    hash: 'unique_hash',
    sizeInBytes: 500
  };

  const reader = new DataReader();

  const opStore = new OperationStore(op);
  (<any>opStore.dequeueBlock).mockReturnValue({});
  (<any>opStore.getBlocksCount).mockReturnValue(0);

  const transmitter = new DataTransmitter(reader, transport, opStore);

  return { reader, op, opStore, transport, transmitter };
}

describe('DataTransmitter', () => {
  let context: TestContext = null;

  beforeEach(async () => {
    context = await prepareTestContext();
  })

  test('Перед отправкой первого блока данных, должна происходить отправка запроса на начало передачи', async () => {
    await context.transmitter.transmit(context.op);
    
    expect(context.transport.beginTransferOperation).toBeCalledTimes(1);
  });

  test('При получении подтверждения о начале передачи от принимающей стороны, должна запускаться операция считывания данных', async () => {
  });

  test('При получении подтверждения сохранения блока на принимающей стороне, счетчик блоков должен уменьшаться', async () => {
  });

  test('При уменьшении счетчика блоков до нуля, должно отправляться сообщение о завершении операции передачи', async () => {
  });

  test('При превышении времени ожидания подтверждения от принимающей стороны получения блока, этот же блок должен быть отправлен повторно', async () => {
  });
});
