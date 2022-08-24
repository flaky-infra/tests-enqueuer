import {brokerWrapper, FLAKY_EXCHANGE_NAME, getCompleteUri} from 'flaky-common';
import {ProjectReadyListener} from './messages/listeners/project-ready-listener';

async function start() {
  if (!process.env.FLAKY_RABBITMQ_URI)
    throw new Error('FLAKY_RABBITMQ_URI must be defined');
  if (!process.env.FLAKY_RABBITMQ_USERNAME)
    throw new Error('FLAKY_RABBITMQ_USERNAME must be defined');
  if (!process.env.FLAKY_RABBITMQ_PASSWORD)
    throw new Error('FLAKY_RABBITMQ_PASSWORD must be defined');
  if (!process.env.FLAKY_REDIS_URI)
    throw new Error('FLAKY_REDIS_URI must be defined');
  const rabbitUri = getCompleteUri(
    process.env.FLAKY_RABBITMQ_URI,
    process.env.FLAKY_RABBITMQ_USERNAME,
    process.env.FLAKY_RABBITMQ_PASSWORD
  );

  await brokerWrapper.connect(rabbitUri, FLAKY_EXCHANGE_NAME, 'topic');
  await new ProjectReadyListener(brokerWrapper).listen();
}

start();
