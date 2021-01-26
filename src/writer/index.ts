import * as path from 'path';
import { NatsListener } from './nats_listener';
import { WsListener } from './ws_listener';
import { DataWriter } from './data_writer';
import { DataReceiver } from './data_receiver';
import * as fs from 'fs';

(async () => {
  //const listener = new NatsListener();
  const listener = new WsListener();

  const filePath = path.join(__dirname, 'files');

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }

  const writer = new DataWriter(filePath);

  const receiver = new DataReceiver(writer, listener);

  await receiver.receive();
})();