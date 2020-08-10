import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import QueueStatsView from './QueuesStatsView';
import { Actions } from '../../../states/QueuesStats';

class QueueStatsViewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      liveQuery: null
    };

    this.fetchQueues = this.fetchQueues.bind(this);
    this.closeQueuesLiveQuery = this.closeQueuesLiveQuery.bind(this);
  }

  componentDidMount() {
    this.fetchQueues();
  }

  async fetchQueues() {
    const { queuesList, setQueuesList, supervisors, manager } = this.props;
    const { attributes } = manager.workerClient;

    const supervisor = supervisors.find(
      supervisor => supervisor.email === attributes.email
    );
    const queuesListExpression = supervisor.queues
      .map(queue => `"${queue}"`)
      .join(',');

    const liveQuery = await this.props.manager.insightsClient.liveQuery(
      'tr-queue',
      `data.queue_name IN [${queuesListExpression}]`
    );

    const queues = new Map(queuesList);

    Object.entries(liveQuery.getItems()).forEach(([queueSid, data]) => {
      queues.set(data.queue_name, {
        sid: queueSid,
        friendly_name: data.queue_name
      });
    });

    setQueuesList(queues);

    this.setState({ liveQuery });
  }

  componentWillUnmount() {
    this.closeQueuesLiveQuery();
  }

  closeQueuesLiveQuery() {
    const { liveQuery } = this.state;

    if (liveQuery) {
      liveQuery.close();
    }
  }

  render() {
    const { queuesList } = this.props.queuesStats;
    const { tasks_list, workers } = this.props.workspaceStats;

    const tasksByQueuesZeroValues = new Map();
    Array.from(queuesList.values()).forEach(queue => {
      tasksByQueuesZeroValues.set(queue.friendly_name, {
        assigned: 0,
        pending: 0,
        reserved: 0,
        wrapping: 0
      });
    });

    const tasksByQueues = Array.from(tasks_list.values()).reduce(
      (tasksByQueues, task) => {
        const tasksAlreadyComputed = tasksByQueues.get(task.queue_name)[
          task.status
        ];

        tasksByQueues.set(task.queue_name, {
          ...tasksByQueues.get(task.queue_name),
          [task.status]: tasksAlreadyComputed + 1
        });

        return tasksByQueues;
      },
      tasksByQueuesZeroValues
    );

    const workersByQueue = Array.from(workers.values()).reduce(
      (workersByQueue, worker) => {
        const { routing: { skills } } = worker.attributes;

        skills.forEach(team => {
          const workersAlreadyComputed =
            (workersByQueue.get(team) &&
              workersByQueue.get(team)[worker.activity_name.toLowerCase()]) ||
            0;

          workersByQueue.set(team, {
            ...workersByQueue.get(team),
            [worker.activity_name.toLowerCase()]: workersAlreadyComputed + 1
          });
        });

        return workersByQueue;
      },
      new Map()
    );

    return (
      <QueueStatsView
        queuesList={queuesList}
        tasksByQueues={tasksByQueues}
        workersByQueue={workersByQueue}
      />
    );
  }
}

const mapStateToProps = state => ({
  workspaceStats: state['realtime-queues-roles-filter'].workspaceStats,
  queuesStats: state['realtime-queues-roles-filter'].queuesStats
});

const mapDispatchToProps = dispatch => ({
  setQueuesList: bindActionCreators(Actions.setQueuesList, dispatch),
  setTasksByQueues: bindActionCreators(Actions.setTasksByQueues, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(QueueStatsViewContainer);
