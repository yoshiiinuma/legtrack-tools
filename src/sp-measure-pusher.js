
import LocalSpMeasure from './local-sp-measure.js';
import RemoteSpMeasure from './remote-sp-measure.js';
import Pusher from './pusher.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const run = async (env = nodeEnv) => {
  const localModel = LocalSpMeasure.create(env);
  const remoteModel = RemoteSpMeasure.create(env);
  const pusher = Pusher.create('SP_MEASURE', localModel, remoteModel, env);
  return await pusher.run();
};

const SpMeasurePusher = {
  run
};

export default SpMeasurePusher;
