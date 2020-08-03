import React from 'react';
import CustomQueueStatsView from './CustomQueueStatsView';

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

class CustomQueueStatsViewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      workspaceStats: {},
      queuesList: new Map(),
      tasksByQueues: new Map()
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
    this.clearTaskMovedForAnotherTeam = this.clearTaskMovedForAnotherTeam.bind(
      this
    );
  }

  async componentDidMount() {
    // The tasks statistics depends of the Worker's. Hence, we have to wait for the worker's statistics load
    // before initializing the Tasks's one.
    await this.initWorkerStatistics();

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

    this.initTasksStatistics();
  }

  async initWorkerStatistics() {
    const { manager } = this.props;
    const activityStatistics = getInitialActivityStatistics();

    const workersStatus = new Map();
    const { attributes: workerAttributes } = manager.workerClient;

    // TODO: build expression to support multiple teams
    const liveQuery = await manager.insightsClient.liveQuery(
      'tr-worker',
      `data.attributes.teams == "${workerAttributes.teams}"`
    );

    const workers = Object.values(liveQuery.getItems());
    workers.forEach(data => {
      const status = data.activity_name.toLowerCase();
      activityStatistics[status].workers++;
      workersStatus.set(data.worker_sid, status);
    });

    liveQuery.on('itemUpdated', this.handleWorkerUpdate);
    liveQuery.on('itemRemoved', this.handleWorkerRemoval);

    this.setState({
      workspaceStats: {
        ...this.state.workspaceStats,
        activity_statistics: activityStatistics,
        total_workers: workers.length,
        workers_status: workersStatus
      }
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
      const tasksByQueues = new Map(this.state.tasksByQueues);

      tasks.forEach(([, task]) => {
        if (this.isTaskReservedForAnotherTeam(task)) {
          return;
        }

        tasksByStatus[task.status]++;
        tasksByPriority[task.priority]
          ? tasksByPriority[task.priority]++
          : (tasksByPriority[task.priority] = 1);

        tasksStatus.set(task.task_sid, task.status);
        tasksByQueues.set(task.queue_name, {
          ...tasksByQueues.get(task.queue_name),
          [task.status]: tasksByQueues.get(task.queue_name)[task.status] + 1
        });
      });

      liveQuery.on('itemUpdated', this.handleTaskUpdate);
      liveQuery.on('itemRemoved', this.handleTaskRemoval);

      this.setState({
        tasksByQueues,
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
      return this.clearTaskMovedForAnotherTeam(data);
    }

    const updatedTasksStatus = new Map(this.state.workspaceStats.tasks_status);

    const oldTaskStatus = updatedTasksStatus.get(data.task_sid);
    const newWorkspaceStats = { ...this.state.workspaceStats };
    const newTasksByQueues = new Map(this.state.tasksByQueues);

    if (oldTaskStatus) {
      newWorkspaceStats.tasks_by_status[oldTaskStatus]--;
      newTasksByQueues.set(data.queue_name, {
        ...newTasksByQueues.get(data.queue_name),
        [oldTaskStatus]: newTasksByQueues.get(data.queue_name)[oldTaskStatus] - 1
      });
    }

    newWorkspaceStats.tasks_by_status[data.status]++;

    updatedTasksStatus.set(data.task_sid, data.status);
    // TODO: verify better name for "task status" variable
    newWorkspaceStats.tasks_status = updatedTasksStatus;

    newTasksByQueues.set(data.queue_name, {
      ...newTasksByQueues.get(data.queue_name),
      [data.status]: newTasksByQueues.get(data.queue_name)[data.status] + 1
    });

    this.setState({ workspaceStats: newWorkspaceStats, tasksByQueues: newTasksByQueues });
  }

  clearTaskMovedForAnotherTeam(data) {
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
    return (
      <CustomQueueStatsView
        workspaceStats={this.state.workspaceStats}
        queuesList={this.state.queuesList}
        tasksByQueues={this.state.tasksByQueues}
      />
    );
  }
}

export default CustomQueueStatsViewContainer;
