import React from 'react';
import CustomQueueStatsView from './CustomQueueStatsView';

class CustomQueueStatsViewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      workspaceStats: {}
    };

    this.initWorkerStatistics = this.initWorkerStatistics.bind(this);
    this.handleWorkerUpdate = this.handleWorkerUpdate.bind(this);
    this.handleWorkerRemoval = this.handleWorkerRemoval.bind(this);

    this.initTasksStatistics = this.initTasksStatistics.bind(this);
    this.handleTaskUpdate = this.handleTaskUpdate.bind(this);
    this.handleTaskRemoval = this.handleTaskRemoval.bind(this);
    this.isTaskReservedForAnotherTeam = this.isTaskReservedForAnotherTeam.bind(
      this
    );
  }

  async componentDidMount() {
    await this.initWorkerStatistics();
    this.initTasksStatistics();
  }

  async initWorkerStatistics() {
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

    const { attributes: workerAttributes } = manager.workerClient;

    return new Promise(resolve => {
      // TODO: build expression to support multiple teams
      manager.insightsClient
        .liveQuery(
          'tr-worker',
          `data.attributes.teams == "${workerAttributes.teams}"`
        )
        .then(liveQuery => {
          const workers = Object.entries(liveQuery.getItems());
          workers.forEach(([, data]) => {
            const status = data.activity_name.toLowerCase();
            activityStatistics[status].workers++;
            workersStatus.set(data.worker_sid, status);
          });

          liveQuery.on('itemUpdated', this.handleWorkerUpdate);
          liveQuery.on('itemRemoved', this.handleWorkerRemoval);

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

          resolve();
        });
    });
  }

  handleWorkerUpdate({ value: data }) {
    const workersStatus = new Map(this.state.workspaceStats.workers_status);
    const status = data.activity_name.toLowerCase();
    const oldStatus = workersStatus.get(data.worker_sid);

    workersStatus.set(data.worker_sid, status);

    const newWorkspaceStats = { ...this.state.workspaceStats };

    if (oldStatus) {
      const {
        workers: oldWorkersCount
      } = newWorkspaceStats.activity_statistics[oldStatus];
      newWorkspaceStats.activity_statistics[oldStatus].workers =
        oldWorkersCount - 1;
    }

    const { workers: oldWorkersCount } = newWorkspaceStats.activity_statistics[
      status
    ];
    newWorkspaceStats.activity_statistics[status].workers = oldWorkersCount + 1;
    newWorkspaceStats.workers_status = workersStatus;

    this.setState({
      workspaceStats: newWorkspaceStats
    });
  }

  handleWorkerRemoval({ key: workerSid }) {
    const workersStatus = new Map(this.state.workspaceStats.workers_status);
    const removedWorkerStatus = workersStatus.get(workerSid);

    if (!removedWorkerStatus) {
      console.warn(
        `status for removed worker ${workerSid} wasn't found for update`
      );
      return;
    }

    const newWorkspaceStats = { ...this.state.workspaceStats };

    const { workers: oldWorkersCount } = newWorkspaceStats.activity_statistics[
      removedWorkerStatus
    ];
    newWorkspaceStats.activity_statistics[removedWorkerStatus].workers =
      oldWorkersCount - 1;

    workersStatus.delete(workerSid);
    newWorkspaceStats.workers_status = workersStatus;

    this.setState({
      workspaceStats: newWorkspaceStats
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
      const tasksStatus = new Map();

      tasks.forEach(([, task]) => {
        if (this.isTaskReservedForAnotherTeam(task)) {
          return;
        }

        tasksByStatus[task.status]++;
        tasksByPriority[task.priority]
          ? tasksByPriority[task.priority]++
          : (tasksByPriority[task.priority] = 1);

        tasksStatus.set(task.task_sid, task.status);
      });

      liveQuery.on('itemUpdated', this.handleTaskUpdate);
      liveQuery.on('itemRemoved', this.handleTaskRemoval);

      this.setState({
        workspaceStats: {
          ...this.state.workspaceStats,
          tasks_by_status: tasksByStatus,
          tasks_by_priority: tasksByPriority,
          total_tasks: tasks.length,
          tasks_status: tasksStatus
        }
      });
    });
  }

  isTaskReservedForAnotherTeam(task) {
    const { workers_status } = this.state.workspaceStats;

    return task.status !== 'pending' && !workers_status.has(task.worker_sid);
  }

  handleTaskUpdate({ value: data }) {
    if (this.isTaskReservedForAnotherTeam(data)) {
      if (this.state.workspaceStats.tasks_status.has(data.task_sid)) {
        const updatedTasksStatus = new Map(
          this.state.workspaceStats.tasks_status
        );
        const newWorkspaceStats = { ...this.state.workspaceStats };

        const lastTaskStatus = updatedTasksStatus.get(data.task_sid);
        newWorkspaceStats.tasks_by_status[lastTaskStatus]--;

        updatedTasksStatus.delete(data.task_sid);
        newWorkspaceStats.tasks_status = updatedTasksStatus;

        this.setState({ workspaceStats: newWorkspaceStats });
      }

      return;
    }

    const updatedTasksStatus = new Map(this.state.workspaceStats.tasks_status);

    const oldTaskStatus = updatedTasksStatus.get(data.task_sid);
    const newWorkspaceStats = { ...this.state.workspaceStats };

    if (oldTaskStatus) {
      newWorkspaceStats.tasks_by_status[oldTaskStatus]--;
    }

    newWorkspaceStats.tasks_by_status[data.status]++;

    updatedTasksStatus.set(data.task_sid, data.status);
    // TODO: verify better name for "task status" variable
    newWorkspaceStats.tasks_status = updatedTasksStatus;

    this.setState({ workspaceStats: newWorkspaceStats });
  }

  handleTaskRemoval({ key: taskSid }) {
    if (this.isTaskReservedForAnotherTeam) {
      return;
    }

    const updatedTasksStatus = new Map(this.state.workspaceStats.tasks_status);
    const lastTaskStatus = updatedTasksStatus.get(taskSid);

    if (!lastTaskStatus) {
      console.warn(
        `status for removed task ${taskSid} wasn't found for update`
      );
      return;
    }

    const newWorkspaceStats = { ...this.state.workspaceStats };
    newWorkspaceStats.tasks_by_status[lastTaskStatus]--;

    updatedTasksStatus.delete(taskSid);
    newWorkspaceStats.tasks_status = updatedTasksStatus;

    this.setState({
      workspaceStats: newWorkspaceStats
    });
  }

  render() {
    return <CustomQueueStatsView workspaceStats={this.state.workspaceStats} />;
  }
}

export default CustomQueueStatsViewContainer;
