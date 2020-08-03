import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import WorkspaceStatsView from './WorkspaceStatsView';
import { Actions } from '../../../states/WorkspaceStats';

class WorkspaceStatsViewContainer extends React.Component {
  constructor(props) {
    super(props);

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
    this.initTasksStatistics();
  }

  async initWorkerStatistics() {
    const { workspaceStats, setWorkspaceStats, manager } = this.props;
    const {
      activity_statistics: activityStatistics,
      workers_status: workersStatus
    } = { ...workspaceStats }; // using spread operator to avoid modifying props directly

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

    setWorkspaceStats({
      activity_statistics: activityStatistics,
      total_workers: workers.length,
      workers_status: workersStatus
    });
  }

  handleWorkerUpdate({ value: data }) {
    const { setWorkspaceStats, workspaceStats } = this.props;

    const newWorkerStatus = new Map(workspaceStats.workers_status);
    const status = data.activity_name.toLowerCase();
    const oldStatus = newWorkerStatus.get(data.worker_sid);

    const newActivityStatistics = { ...workspaceStats.activity_statistics };

    if (oldStatus) {
      const { workers: oldWorkersCount } = newActivityStatistics[oldStatus];
      newActivityStatistics[oldStatus].workers = oldWorkersCount - 1;
    }

    const { workers: oldWorkersCount } = newActivityStatistics[status];
    newActivityStatistics[status].workers = oldWorkersCount + 1;
    newWorkerStatus.set(data.worker_sid, status);

    setWorkspaceStats({
      workers_status: newWorkerStatus,
      activity_statistics: newActivityStatistics
    });
  }

  handleWorkerRemoval({ key: workerSid }) {
    const { workspaceStats, setWorkspaceStats } = this.props;

    const workersStatus = new Map(workspaceStats.workers_status);
    const removedWorkerStatus = workersStatus.get(workerSid);

    if (!removedWorkerStatus) {
      console.warn(
        `status for removed worker ${workerSid} wasn't found for update`
      );
      return;
    }

    const newWorkspaceStats = { workspaceStats };

    const { workers: oldWorkersCount } = newWorkspaceStats.activity_statistics[
      removedWorkerStatus
    ];
    newWorkspaceStats.activity_statistics[removedWorkerStatus].workers =
      oldWorkersCount - 1;

    workersStatus.delete(workerSid);
    newWorkspaceStats.workers_status = workersStatus;

    setWorkspaceStats(newWorkspaceStats);
  }

  initTasksStatistics() {
    const { manager, setWorkspaceStats } = this.props;

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

      setWorkspaceStats({
        tasks_by_status: tasksByStatus,
        tasks_by_priority: tasksByPriority,
        total_tasks: tasks.length,
        tasks_status: tasksStatus
      });
    });
  }

  isTaskReservedForAnotherTeam(task) {
    const { workers_status } = this.props.workspaceStats;

    return task.status !== 'pending' && !workers_status.has(task.worker_sid);
  }

  handleTaskUpdate({ value: data }) {
    if (this.isTaskReservedForAnotherTeam(data)) {
      return this.clearTaskMovedForAnotherTeam(data);
    }

    const { workspaceStats, setWorkspaceStats } = this.props;

    const updatedTasksStatus = new Map(workspaceStats.tasks_status);

    const oldTaskStatus = updatedTasksStatus.get(data.task_sid);
    const updatedTasksByStatus = { ...workspaceStats.tasks_by_status };

    if (oldTaskStatus) {
      updatedTasksByStatus[oldTaskStatus]--;
    }

    updatedTasksByStatus[data.status]++;
    updatedTasksStatus.set(data.task_sid, data.status);

    setWorkspaceStats({
      tasks_status: updatedTasksStatus,
      tasks_by_status: updatedTasksByStatus
    });
  }

  clearTaskMovedForAnotherTeam(data) {
    const { workspaceStats, setWorkspaceStats } = this.props;
    if (workspaceStats.tasks_status.has(data.task_sid)) {
      const updatedTasksStatus = new Map(workspaceStats.tasks_status);
      const updatedTasksByStatus = { ...workspaceStats.tasks_by_status };

      const lastTaskStatus = updatedTasksStatus.get(data.task_sid);
      
      updatedTasksByStatus[lastTaskStatus]--;
      updatedTasksStatus.delete(data.task_sid);

      setWorkspaceStats({ 
        tasks_by_status: updatedTasksByStatus,
        tasks_status: updatedTasksStatus
      });
    }
  }

  handleTaskRemoval({ key: taskSid }) {
    // if (this.isTaskReservedForAnotherTeam()) {
    //   return;
    // }

    const { workspaceStats, setWorkspaceStats } = this.props;

    const updatedTasksStatus = new Map(workspaceStats.tasks_status);
    const lastTaskStatus = updatedTasksStatus.get(taskSid);

    if (!lastTaskStatus) {
      console.warn(
        `status for removed task ${taskSid} wasn't found for update`
      );
      return;
    }

    const updatedTasksByStatus = { ...workspaceStats.tasks_by_status };
    updatedTasksByStatus[lastTaskStatus]--;

    updatedTasksStatus.delete(taskSid);

    setWorkspaceStats({
      tasks_by_status: updatedTasksByStatus,
      tasks_status: updatedTasksStatus
    });
  }

  render() {
    return <WorkspaceStatsView workspaceStats={this.props.workspaceStats} />;
  }
}

const mapStateToProps = state => ({
  workspaceStats: state['realtime-queues-roles-filter'].workspaceStats
});

const mapDispatchToProps = dispatch => ({
  setWorkspaceStats: bindActionCreators(Actions.setWorkspaceStats, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkspaceStatsViewContainer);
