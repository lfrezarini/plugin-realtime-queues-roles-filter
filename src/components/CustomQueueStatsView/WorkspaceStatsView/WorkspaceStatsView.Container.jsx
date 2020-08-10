import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import WorkspaceStatsView from './WorkspaceStatsView';
import {
  Actions as WorkspaceActions,
  getInitialAcitvityStatistics
} from '../../../states/WorkspaceStats';

class WorkspaceStatsViewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      workersLiveQuery: null,
      tasksLiveQuery: null
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
    this.initTasksStatistics();
  }

  async initWorkerStatistics() {
    const { setWorkspaceStats, manager } = this.props;

    const { attributes: workerAttributes } = manager.workerClient;

    const activityStatistics = getInitialAcitvityStatistics();
    const workers = new Map();
    
    // TODO: build expression to support multiple teams
    const { REACT_APP_SELECTION_ATTRIBUTE } = process.env;

    const liveQuery = await manager.insightsClient.liveQuery(
      'tr-worker',
      `data.attributes.${REACT_APP_SELECTION_ATTRIBUTE} == "${workerAttributes[REACT_APP_SELECTION_ATTRIBUTE]}"`
    );

    const items = Object.values(liveQuery.getItems());

    items.forEach(data => {
      const status = data.activity_name.toLowerCase();
      activityStatistics[status].workers++;
      workers.set(data.worker_sid, data);
    });

    liveQuery.on('itemUpdated', this.handleWorkerUpdate);
    liveQuery.on('itemRemoved', this.handleWorkerRemoval);

    setWorkspaceStats({
      workers,
      activity_statistics: activityStatistics,
    });

    this.setState({ workersLiveQuery: liveQuery });
  }

  handleWorkerUpdate({ value: data }) {
    const { setWorkspaceStats, workspaceStats } = this.props;

    const newWorkersList = new Map(workspaceStats.workers);
    const worker = newWorkersList.get(data.worker_sid);
    const newStatus = data.activity_name.toLowerCase();
    const oldStatus = worker && worker.activity_name.toLowerCase();

    const newActivityStatistics = { ...workspaceStats.activity_statistics };

    if (worker) {
      const { workers: workersCount } = newActivityStatistics[oldStatus];
      newActivityStatistics[oldStatus].workers = workersCount - 1;
    }

    const { workers: workersCount } = newActivityStatistics[newStatus];
    newActivityStatistics[newStatus].workers = workersCount + 1;
    newWorkersList.set(data.worker_sid, data);

    setWorkspaceStats({
      workers: newWorkersList,
      activity_statistics: newActivityStatistics
    });
  }

  handleWorkerRemoval({ key: workerSid }) {
    const { workspaceStats, setWorkspaceStats } = this.props;

    const workers = new Map(workspaceStats.workers);
    const removedWorker = workers.get(workerSid);

    if (!removedWorker) {
      console.warn(
        `status for removed worker ${workerSid} wasn't found for update`
      );
      return;
    }

    const { activity_statistics } = workspaceStats;
    const { workers: oldWorkersCount } = activity_statistics[
      removedWorker.activity_name.toLowerCase()
    ];

    if(activity_statistics[removedWorker]) {
      activity_statistics[removedWorker].workers = oldWorkersCount - 1;
    }

    workers.delete(workerSid);

    setWorkspaceStats({
      activity_statistics,
      workers
    });
  }

  async initTasksStatistics() {
    const { manager, setWorkspaceStats, supervisors } = this.props;
    const { attributes } = manager.workerClient;

    const tasksByPriority = {};
    const tasksByStatus = {
      reserved: 0,
      pending: 0,
      assigned: 0,
      wrapping: 0
    };

    const supervisor = supervisors.find((supervisor) => supervisor.email === attributes.email)
    const queuesListExpression = supervisor.queues
      .map(queue => `"${queue}"`)
      .join(",");

    const liveQuery = await manager.insightsClient.liveQuery('tr-task', `data.queue_name IN [${queuesListExpression}]`);
    const tasks = Object.values(liveQuery.getItems());
    const tasksList = new Map();

    tasks.forEach(task => {
      if (this.isTaskReservedForAnotherTeam(task)) {
        return;
      }

      tasksByStatus[task.status]++;
      tasksByPriority[task.priority]
        ? tasksByPriority[task.priority]++
        : (tasksByPriority[task.priority] = 1);

      tasksList.set(task.task_sid, task);
    });

    liveQuery.on('itemUpdated', this.handleTaskUpdate);
    liveQuery.on('itemRemoved', this.handleTaskRemoval);

    setWorkspaceStats({
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriority,
      tasks_list: tasksList
    });

    this.setState({ tasksLiveQuery: liveQuery });
  }

  isTaskReservedForAnotherTeam(task) {
    const { workers } = this.props.workspaceStats;

    return task.status !== 'pending' && !workers.has(task.worker_sid);
  }

  handleTaskUpdate({ value: data }) {
    if (this.isTaskReservedForAnotherTeam(data)) {
      return this.clearTaskMovedForAnotherTeam(data);
    }

    const { workspaceStats, setWorkspaceStats } = this.props;

    const updatedTasksList = new Map(workspaceStats.tasks_list);

    const oldTaskStatus =
      updatedTasksList.get(data.task_sid) &&
      updatedTasksList.get(data.task_sid).status;
    const updatedTasksByStatus = { ...workspaceStats.tasks_by_status };

    if (oldTaskStatus) {
      updatedTasksByStatus[oldTaskStatus]--;
    }

    updatedTasksByStatus[data.status]++;
    updatedTasksList.set(data.task_sid, data);

    setWorkspaceStats({
      tasks_list: updatedTasksList,
      tasks_by_status: updatedTasksByStatus
    });
  }

  clearTaskMovedForAnotherTeam(data) {
    const { workspaceStats, setWorkspaceStats } = this.props;

    if (workspaceStats.tasks_list.has(data.task_sid)) {
      const updatedTasksStatus = new Map(workspaceStats.tasks_list);
      const updatedTasksByStatus = { ...workspaceStats.tasks_by_status };

      const lastTaskStatus = updatedTasksStatus.get(data.task_sid).status;

      updatedTasksByStatus[lastTaskStatus]--;
      updatedTasksStatus.delete(data.task_sid);

      setWorkspaceStats({
        tasks_by_status: updatedTasksByStatus,
        tasks_list: updatedTasksStatus
      });
    }
  }

  handleTaskRemoval({ key: taskSid }) {
    const { workspaceStats, setWorkspaceStats } = this.props;
    const updatedTasksStatus = new Map(workspaceStats.tasks_list);
    const task = updatedTasksStatus.get(taskSid);

    if (!task || this.isTaskReservedForAnotherTeam(task)) {
      return;
    }

    const lastTaskStatus = task && updatedTasksStatus.get(taskSid).status;

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
      tasks_list: updatedTasksStatus
    });
  }

  componentWillUnmount() {
    const { tasksLiveQuery, workersLiveQuery } = this.state;

    if (tasksLiveQuery) {
      tasksLiveQuery.close();
    }

    if (workersLiveQuery) {
      workersLiveQuery.close();
    }
  }

  render() {
    return <WorkspaceStatsView workspaceStats={this.props.workspaceStats} />;
  }
}

const mapStateToProps = state => ({
  workspaceStats: state['realtime-queues-roles-filter'].workspaceStats
});

const mapDispatchToProps = dispatch => ({
  setWorkspaceStats: bindActionCreators(
    WorkspaceActions.setWorkspaceStats,
    dispatch
  )
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkspaceStatsViewContainer);
