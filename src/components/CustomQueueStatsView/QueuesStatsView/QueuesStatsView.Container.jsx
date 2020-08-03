import React from 'react';
import QueueStatsView from './QueuesStatsView';

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
    constructor(props) {
      super(props);
  
      this.state = {
        queuesList: new Map(),
        tasksByQueues: new Map()
      };
    }
  
    async componentDidMount() {
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
  
      const queues = new Map();
      const tasksByQueues = new Map();
  
      Object.entries(liveQuery.getItems()).forEach(([queueSid, data]) => {
        tasksByQueues.set(data.queue_name, {
          reserved: 0,
          pending: 0,
          assigned: 0,
          wrapping: 0
        });
  
        queues.set(data.queue_name, {
          sid: queueSid,
          friendly_name: data.queue_name,
          activity_statistics: getInitialActivityStatistics(),
          tasks_by_status: tasksByStatus
        });
      });
  
      this.setState({
        tasksByQueues,
        queuesList: queues,
      });
    }
  
    render() {
      return (
        <QueueStatsView queuesList={this.state.queuesList} tasksByQueues={this.state.tasksByQueues} />
      );
    }
  }

  export default QueueStatsViewContainer;