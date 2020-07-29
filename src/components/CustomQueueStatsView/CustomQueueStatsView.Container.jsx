import React from 'react';
import CustomQueueStatsView from './CustomQueueStatsView';

class CustomQueueStatsViewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      workspaceStats: {}
    };

    this.initWorkerStatistics = this.initWorkerStatistics.bind(this);
    this.initTasksStatistics = this.initTasksStatistics.bind(this);
  }

  componentDidMount() {
    this.initWorkerStatistics();
    this.initTasksStatistics();
  }

  initWorkerStatistics() {
    const { manager } = this.props;

    const activityStatistics = {
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

    const workersStatus = new Map();

    manager.insightsClient
      .liveQuery('tr-worker', 'data.attributes.teams == "blue"')
      .then(liveQuery => {
        const workers = Object.entries(liveQuery.getItems());
        workers.forEach(([, data]) => {
          const status = data.activity_name.toLowerCase()
          activityStatistics[status].workers++;
          workersStatus.set(data.worker_sid, status)
        });

        liveQuery.on('itemUpdated', item => {
          const workersStatus = this.state.workspaceStats.workers_status;
          const status = item.value.activity_name.toLowerCase();
          const oldStatus = workersStatus.get(item.value.worker_sid);

          workersStatus.set(item.value.worker_sid, status);

          this.setState({
            workspaceStats: {
              ...this.state.workspaceStats,
              activity_statistics: {
                ...this.state.workspaceStats.activity_statistics,
                [status]: {
                  ...this.state.workspaceStats.activity_statistics[status],
                  workers:
                    this.state.workspaceStats.activity_statistics[status]
                      .workers + 1
                },
                [oldStatus]: {
                  ...this.state.workspaceStats.activity_statistics[oldStatus],
                  workers:
                    this.state.workspaceStats.activity_statistics[oldStatus]
                      .workers - 1
                }
              },
              workers_status: workersStatus
            }
          });

          console.log('Item ' + item.key + ' was updated');
          console.log('Item value: ', item, item.value);
        });

        const result = {
          activity_statistics: activityStatistics,
          total_workers: workers.length,
          workers_status: workersStatus
        };

        this.setState({
          workspaceStats: {
            ...this.state.workspaceStats,
            ...result
          }
        });
      });
  }

  initTasksStatistics() {
    const { manager } = this.props;

    const tasksByPriority = {};
    const tasksByStatus = {
      reserved: 0,
      pending: 0,
      assigned: 0,
      wrapping: 0
    };

    manager.insightsClient.liveQuery('tr-task', '').then(liveQuery => {
      const tasks = Object.entries(liveQuery.getItems());
      tasks.forEach(([, task]) => {
        tasksByStatus[task.status]++;
        tasksByPriority[task.priority]
          ? tasksByPriority[task.priority]++
          : (tasksByPriority[task.priority] = 1);
      });

      liveQuery.on('itemUpdated', function(item) {
        console.log('Item ' + item.key + ' was updated');
        console.log('Item value: ', item.value);
      });

      console.log('tasks statistics', {
        tasks_by_status: tasksByStatus,
        tasks_by_priority: tasksByPriority,
        total_tasks: tasks.length
      });

      this.setState({
        workspaceStats: {
          ...this.state.workspaceStats,
          tasks_by_status: tasksByStatus,
          tasks_by_priority: tasksByPriority,
          total_tasks: tasks.length
        }
      });
    });
  }

  render() {
    return <CustomQueueStatsView workspaceStats={this.state.workspaceStats} />;
  }
}

export default CustomQueueStatsViewContainer;
