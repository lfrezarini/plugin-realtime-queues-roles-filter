import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import QueueStatsView from './QueuesStatsView';
import { Actions } from '../../../states/QueuesStats';

class QueueStatsViewContainer extends React.Component {
  async componentDidMount() {
    const { queuesList, setQueuesList } = this.props;
    const liveQuery = await this.props.manager.insightsClient.liveQuery(
      'tr-queue',
      ''
    );

    const queues = new Map(queuesList);

    Object.entries(liveQuery.getItems()).forEach(([queueSid, data]) => {
      queues.set(data.queue_name, {
        sid: queueSid,
        friendly_name: data.queue_name
      });
    });

    setQueuesList(queues);
  }

  render() {
    const { queuesList } = this.props.queuesStats;
    const { tasks_list } = this.props.workspaceStats;

    const tasksByQueues = Array.from(tasks_list.values()).reduce((tasksByQueues, task) => {
      const tasksAlreadyComputed = tasksByQueues.get(task.queue_name) && tasksByQueues.get(task.queue_name)[task.satus] || 0;

      tasksByQueues.set(task.queue_name, {
        ...tasksByQueues.get(task.queue_name),
        [task.status]: tasksAlreadyComputed + 1
      });

      return tasksByQueues;
    }, new Map());

    return (
      <QueueStatsView
        queuesList={queuesList}
        tasksByQueues={tasksByQueues}
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

export default connect(mapStateToProps, mapDispatchToProps)(QueueStatsViewContainer);
