
import LocalMeasure from './local-measure.js';
import RemoteMeasure from './remote-measure.js';
import Pusher from './pusher.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const run = async (env = nodeEnv) => {
  const localModel = LocalMeasure.create(env);
  const remoteModel = RemoteMeasure.create(env);
  const pusher = Pusher.create('MEASURE', localModel, remoteModel, env);
  return await pusher.run();
};

const MeasurePusher = {
  run
};

export default MeasurePusher;

