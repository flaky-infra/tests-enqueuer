import {EventTypes, ProjectReadyEvent, Publisher} from 'flaky-common';

interface ProjectTestEvent {
  eventType: EventTypes.ProjectReady;
  data: {
    redisProjectListName: string;
  };
}

export class ProjectTestPublisher extends Publisher<ProjectTestEvent> {
  eventType: EventTypes.ProjectReady = EventTypes.ProjectReady;
  routingKey = 'project.test';
}
