import {ConsumeMessage} from 'amqplib';
import {randomUUID} from 'crypto';
import {
  brokerWrapper,
  EventTypes,
  Listener,
  ProjectReadyEvent,
} from 'flaky-common';
import {readFileSync} from 'fs';
import {readdir} from 'fs/promises';
import {load} from 'js-yaml';
import {join} from 'path';
import {createClient} from 'redis';
import {ProjectTestPublisher} from '../publishers/project-test-publisher';

export class ProjectReadyListener extends Listener<ProjectReadyEvent> {
  eventType: EventTypes.ProjectReady = EventTypes.ProjectReady;
  queueName = `tests-enqueuer/project-ready-${randomUUID()}`;
  routingKey = this.eventType;

  async onMessage(data: ProjectReadyEvent['data'], msg: ConsumeMessage) {
    const {
      projectId,
      testRunId,
      projectPath,
      name,
      commitId,
      testMethodName,
      configurationFolder,
      moduleName,
    } = data;
    console.log('Adding tests in the queue..');
    try {
      const client = createClient({url: process.env.FLAKY_REDIS_URI});
      await client.connect();
      const files = await readdir(join(projectPath, configurationFolder));

      const configBaseObj: any = {};
      configBaseObj.projectId = projectId;
      configBaseObj.testRunId = testRunId;
      configBaseObj.moduleName = moduleName;
      configBaseObj.testMethodName = testMethodName;
      configBaseObj.numberOfRuns = '500';
      configBaseObj.scenarioConfiguration = {base: 'true'};
      configBaseObj.configFile = 'base';
      configBaseObj.imageName = `172.16.97.200:8123/${name}:${commitId.substring(
        commitId.length - 7
      )}`;
      configBaseObj.isLastConfig = false;
      configBaseObj.numberOfScenarios = `${files.length + 1}`;

      const jsonConfig = files.map((configFile, index, array) => {
        const configText = readFileSync(
          join(projectPath, configurationFolder, configFile),
          'utf8'
        );
        const configObj: any = load(configText);
        configObj.projectId = projectId;
        configObj.testRunId = testRunId;
        configObj.moduleName = moduleName;
        configObj.testMethodName = testMethodName;
        configObj.configFile = configFile;
        configObj.imageName = `172.16.97.200:8123/${name}:${commitId.substring(
          commitId.length - 7
        )}`;
        configObj.isLastConfig = array.length - 1 == index;
        configObj.numberOfScenarios = `${files.length + 1}`;
        return JSON.stringify(configObj);
      });

      jsonConfig.splice(0, 0, JSON.stringify(configBaseObj));

      await client.rPush('runTestQueue', jsonConfig);
      await client.quit();
      new ProjectTestPublisher(brokerWrapper).publish({
        redisProjectListName: 'runTestQueue',
      });
    } catch (err) {
      console.error(err);
    }
  }
}
