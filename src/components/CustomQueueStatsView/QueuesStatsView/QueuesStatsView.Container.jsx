import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import QueueStatsView from './QueuesStatsView';
import { Actions } from '../../../states/QueuesStats';

const getInitialActivityStatistics = () => {
  return {
    offline: {
      sid: process.env.REACT_APP_ACTIVITY_OFFLINE_SID,
      workers: 0,
      friendly_name: 'Offline'
    },
    break: {
      sid: process.env.REACT_APP_ACTIVITY_BREAK_SID,
      workers: 0,
      friendly_name: 'Break'
    },
    available: {
      sid: process.env.REACT_APP_ACTIVITY_AVAILABLE_SID,
      workers: 0,
      friendly_name: 'Available'
    },
    unavailable: {
      sid: process.env.REACT_APP_ACTIVITY_UNAVAILABLE_SID,
      workers: 0,
      friendly_name: 'Unavailable'
    }
  };
};

class QueueStatsViewContainer extends React.Component {
  async componentDidMount() {
    const { queuesList, tasksByQueues, setQueuesList, setTasksByQueues } = this.props;
    const liveQuery = await this.props.manager.insightsClient.liveQuery(
      'tr-queue',
      ''
    );

    const tasksByStatus = {
      reserved: 0,
      pending: 0,
      assigned: 0,
      wrapping: 0
    };

    const queues = new Map(queuesList);
    
    Object.entries(liveQuery.getItems()).forEach(([queueSid, data]) => {
      queues.set(data.queue_name, {
        sid: queueSid,
        friendly_name: data.queue_name,
        activity_statistics: getInitialActivityStatistics(),
        tasks_by_status: tasksByStatus
      });
    });

    setQueuesList(queues);
  }

  render() {
    const { queuesList, tasksByQueues } = this.props.queuesStats;

    console.log('props', this.props)
    return (
      <QueueStatsView
        queuesList={queuesList}
        tasksByQueues={tasksByQueues}
      />
    );
  }
}

const mapStateToProps = state => ({
  queuesStats: state['realtime-queues-roles-filter'].queuesStats
});

const mapDispatchToProps = dispatch => ({
  setQueuesList: bindActionCreators(Actions.setQueuesList, dispatch),
  setTasksByQueues: bindActionCreators(Actions.setTasksByQueues, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(QueueStatsViewContainer);
