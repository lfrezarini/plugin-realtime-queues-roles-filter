import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import WorkspaceStatsView from './WorkspaceStatsView';
import { Actions as WorkspaceActions } from '../../../states/WorkspaceStats';
import { Actions as QueuesStatsActions } from '../../../states/QueuesStats';


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
    const { manager, setWorkspaceStats, setTasksByQueues, queuesStats } = this.props;
    const { tasksByQueues } = queuesStats;

    const tasksByPriority = {};
    const tasksByStatus = {
      reserved: 0,
      pending: 0,
      assigned: 0,
      wrapping: 0
    };

    manager.insightsClient.liveQuery('tr-task', '').then(liveQuery => {
      const tasks = Object.values(liveQuery.getItems());
      const tasksList = new Map();
      const updatedTasksByQueues = new Map(tasksByQueues);

      tasks.forEach((task) => {
        if (this.isTaskReservedForAnotherTeam(task)) {
          return;
        }

        tasksByStatus[task.status]++;
        tasksByPriority[task.priority]
          ? tasksByPriority[task.priority]++
          : (tasksByPriority[task.priority] = 1);

        tasksList.set(task.task_sid, task);

        const queueTasksCount = tasksByQueues.get(task.queue_name) && tasksByQueues.get(task.queue_name)[task.status] || 0;
        
        updatedTasksByQueues.set(task.queue_name, {	
          ...tasksByQueues.get(task.queue_name),	
          [task.status]: queueTasksCount + 1
        });
      });

      liveQuery.on('itemUpdated', this.handleTaskUpdate);
      liveQuery.on('itemRemoved', this.handleTaskRemoval);

      setWorkspaceStats({
        tasks_by_status: tasksByStatus,
        tasks_by_priority: tasksByPriority,
        total_tasks: tasks.length,
        tasks_list: tasksList
      });

      setTasksByQueues(updatedTasksByQueues);
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

    const { workspaceStats, setWorkspaceStats, queuesStats, setTasksByQueues } = this.props;
    const { tasksByQueues } = queuesStats;

    const updatedTasksList = new Map(workspaceStats.tasks_list);
    const updatedTasksByQueues = new Map(tasksByQueues);

    const oldTaskStatus = updatedTasksList.get(data.task_sid) && updatedTasksList.get(data.task_sid).status;
    const updatedTasksByStatus = { ...workspaceStats.tasks_by_status };

    if (oldTaskStatus) {
      updatedTasksByStatus[oldTaskStatus]--;

      const oldQueueTasksCount = tasksByQueues.get(data.queue_name) && tasksByQueues.get(data.queue_name)[oldTaskStatus];

      if (oldQueueTasksCount) {
        updatedTasksByQueues.set(data.queue_name, {	
          ...updatedTasksByQueues.get(data.queue_name),	
          [oldTaskStatus]: oldQueueTasksCount - 1
        });
      }
    }

    updatedTasksByStatus[data.status]++;
    updatedTasksList.set(data.task_sid, data);

    const queueTasksCount = tasksByQueues.get(data.queue_name) && tasksByQueues.get(data.queue_name)[data.status] || 0;

    updatedTasksByQueues.set(data.queue_name, {	
      ...updatedTasksByQueues.get(data.queue_name),	
      [data.status]: queueTasksCount + 1
    });

    setWorkspaceStats({
      tasks_list: updatedTasksList,
      tasks_by_status: updatedTasksByStatus
    });

    setTasksByQueues(updatedTasksByQueues);
  }

  clearTaskMovedForAnotherTeam(data) {
    const { workspaceStats, setWorkspaceStats } = this.props;
    if (workspaceStats.tasks_list.has(data.task_sid)) {
      const updatedTasksStatus = new Map(workspaceStats.tasks_list);
      const updatedTasksByStatus = { ...workspaceStats.tasks_by_status };

      const lastTaskStatus = updatedTasksStatus.get(data.task_sid);
      
      updatedTasksByStatus[lastTaskStatus]--;
      updatedTasksStatus.delete(data.task_sid);

      setWorkspaceStats({ 
        tasks_by_status: updatedTasksByStatus,
        tasks_list: updatedTasksStatus
      });
    }
  }

  handleTaskRemoval({ key: taskSid }) {
    // if (this.isTaskReservedForAnotherTeam()) {
    //   return;
    // }

    const { workspaceStats, setWorkspaceStats, queuesStats, setTasksByQueues } = this.props;
    const { tasksByQueues } = queuesStats;

    const updatedTasksStatus = new Map(workspaceStats.tasks_list);
    const task = updatedTasksStatus.get(taskSid);
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

    const updatedTasksByQueues = new Map(tasksByQueues);

    const queueTasksCount = updatedTasksByQueues.get(task.queue_name) && updatedTasksByQueues.get(task.queue_name)[task.status] || 0;

    updatedTasksByQueues.set(task.queue_name, {	
      ...updatedTasksByQueues.get(task.queue_name),	
      [lastTaskStatus]: queueTasksCount - 1
    });

    setWorkspaceStats({
      tasks_by_status: updatedTasksByStatus,
      tasks_list: updatedTasksStatus
    });

    setTasksByQueues(updatedTasksByQueues);
  }

  render() {
    return <WorkspaceStatsView workspaceStats={this.props.workspaceStats} />;
  }
}

const mapStateToProps = state => ({
  workspaceStats: state['realtime-queues-roles-filter'].workspaceStats,
  queuesStats: state['realtime-queues-roles-filter'].queuesStats
});

const mapDispatchToProps = dispatch => ({
  setWorkspaceStats: bindActionCreators(WorkspaceActions.setWorkspaceStats, dispatch),
  setTasksByQueues: bindActionCreators(QueuesStatsActions.setTasksByQueues, dispatch)
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WorkspaceStatsViewContainer);
