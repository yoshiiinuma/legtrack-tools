
import LocalHearing from '../src/local-hearing.js';
import RemoteHearing from '../src/remote-hearing.js';
import Pusher from '../src/pusher.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const run = async (env = nodeEnv) => {
  const localModel = LocalHearing.create(env);
  const remoteModel = RemoteHearing.create(env);
  const pusher = Pusher.create('HEARING', localModel, remoteModel, env);
  return await pusher.run();
};

const HearingPusher = {
  run
};

export default HearingPusher;
