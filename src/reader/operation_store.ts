import Redis from 'ioredis';
import { DataBlock } from './data_block';
import { DataTransferOperation } from './data_transfer_operation';

export class OperationStore {
  private redis: any;
  private operation: DataTransferOperation;

  constructor (operation: DataTransferOperation) {
    if (!operation) {
      throw new Error('operation is required');
    }

    this.redis = new Redis();
    this.operation = operation;
  }

  async init () {
    await this.redis.del(`${this.operation.hash}/blocks`);
    await this.redis.set(`${this.operation.hash}/blocksCount`, this.operation.blocksCount);
    await this.redis.set(`${this.operation.hash}/pause`, false);
  }

  async enqueueBlock (block: DataBlock | string) {
    await this.redis.rpush(`${this.operation.hash}/blocks`, typeof block === 'string' ? block : JSON.stringify(block));
  }

  async dequeueBlock (): Promise<string> {
    const block = await this.redis.lpop(`${this.operation.hash}/blocks`);

    return block;
  }

  async decrementBlocksCount (): Promise<number> {
    return this.redis.decr(`${this.operation.hash}/blocksCount`);
  }

  async queueLength (): Promise<number> {
    const len = await this.redis.llen(`${this.operation.hash}/blocks`);

    return len;
  }

  async getBlocksCount (): Promise<number> {
    const blocksCount = Number(await this.redis.get(`${this.operation.hash}/blocksCount`));

    return blocksCount;
  }

  async setPause () {
    console.log('On pause');
    await this.redis.set(`${this.operation.hash}/pause`, true);
  }

  async setResume () {
    console.log('On resume');
    await this.redis.set(`${this.operation.hash}/pause`, false);
  }

  async isPaused (): Promise<Boolean> {
    const paused = JSON.parse(await this.redis.get(`${this.operation.hash}/pause`));

    return paused;
  }
}