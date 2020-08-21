import React from 'react';

import { Grid } from '@material-ui/core';
import {
  ActiveTasks,
  WaitingTasks,
  AgentByActivityChart
} from './WorkspaceStatsView.Components';
import { Wrapper } from './WorkspaceStatsView.Styles';

const WorkspaceStatsView = ({ workspaceStats }) => {
  const { tasks_by_status } = workspaceStats;

  return (
    <Wrapper container spacing={16} style={{ padding: '0px 16px' }}>
      <Grid item xs={4}>
        <ActiveTasks
          count={
            tasks_by_status &&
            tasks_by_status.assigned + tasks_by_status.wrapping
          }
        />
      </Grid>
      <Grid item xs={4}>
        <WaitingTasks
          count={
            tasks_by_status &&
            tasks_by_status.pending + tasks_by_status.reserved
          }
        />
      </Grid>
      <Grid item xs={4}>
        <AgentByActivityChart
          availableAgents={
            workspaceStats &&
            workspaceStats.activity_statistics &&
            workspaceStats.activity_statistics.available.workers
          }
          offlineAgents={
            workspaceStats &&
            workspaceStats.activity_statistics &&
            workspaceStats.activity_statistics.offline.workers
          }
          unavailableAgents={
            workspaceStats &&
            workspaceStats.activity_statistics &&
            workspaceStats.activity_statistics.unavailable.workers
          }
        />
      </Grid>
    </Wrapper>
  );
};

export default WorkspaceStatsView;
