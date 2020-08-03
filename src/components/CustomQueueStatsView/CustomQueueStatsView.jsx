import React from 'react';
import styled from 'react-emotion';

import {
  AggregatedDataTile,
  Template,
  templates,
  StackedBarChart,
  Legend,
  Theme,
  withTheme,
  Icon
} from '@twilio/flex-ui';
import {
  Grid,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead
} from '@material-ui/core';
import { Marker } from './CustomQueueStatsView.Styles';

const ActiveTasks = ({ count }) => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.ActiveTasksTileTitle} />}
      content={count}
    />
  );
};

const WaitingTasks = ({ count }) => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.WaitingTasksTileTitle} />}
      content={count}
    />
  );
};

const LongestWaitingCall = props => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.LongestWaitTimeTileTitle} />}
      content='0'
    />
  );
};

class AgentByActivityChart extends React.Component {
  render() {
    const {
      availableAgents = 0,
      unavailableAgents = 0,
      offlineAgents = 0,
      theme
    } = this.props;

    const mappedProps = [
      {
        value: availableAgents,
        label: templates.AgentStatusAvailable
          ? templates.AgentStatusAvailable()
          : '',
        color: theme ? theme.colors.agentAvailableColor : '',
        renderMarker: props => <Marker color={props.color} icon='Accept' />
      },
      {
        value: unavailableAgents,
        label: templates.AgentStatusUnavailable
          ? templates.AgentStatusUnavailable()
          : '',
        color: theme ? theme.colors.agentUnavailableColor : '',
        renderMarker: props => <Marker color={props.color} icon='Close' />
      },
      {
        value: offlineAgents,
        label: templates.AgentStatusOffline
          ? templates.AgentStatusOffline()
          : '',
        color: theme ? theme.colors.agentOfflineColor : '',
        renderMarker: props => <Marker color={props.color} icon='Minus' />
      }
    ];

    return (
      <AggregatedDataTile
        title={<Template source={templates.AgentsByActivityTileTitle} />}
      >
        <StackedBarChart items={mappedProps} />
        <Legend items={mappedProps} labelPosition='start' showLabels />
      </AggregatedDataTile>
    );
  }
}

const ThemedAgentByActivityChart = withTheme(AgentByActivityChart);

const CustomQueueStatsView = ({ workspaceStats, queuesList, tasksByQueues }) => {
  const { tasks_by_status } = workspaceStats;

  console.log(workspaceStats, tasks_by_status);
  return (
    <>
      <Grid container spacing={24} style={{ padding: '0px 16px' }}>
        <Grid item xs={3}>
          <ActiveTasks
            count={
              tasks_by_status &&
              tasks_by_status.assigned + tasks_by_status.wrapping
            }
          />
        </Grid>
        <Grid item xs={3}>
          <WaitingTasks
            count={
              tasks_by_status &&
              tasks_by_status.pending + tasks_by_status.reserved
            }
          />
        </Grid>
        <Grid item xs={3}>
          <LongestWaitingCall />
        </Grid>
        <Grid item xs={3}>
          <ThemedAgentByActivityChart
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
      </Grid>
      <Grid>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Queue</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Waiting</TableCell>
              <TableCell>Longest</TableCell>
              <TableCell>Agents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(queuesList.values()).map(queue => {
              const { friendly_name, tasks_by_status } = queue;
              const queueTasks = tasksByQueues.get(friendly_name);

              return (
                <TableRow>
                  <TableCell>{friendly_name}</TableCell>
                  <TableCell>{queueTasks && queueTasks.assigned + queueTasks.wrapping}</TableCell>
                  <TableCell>{queueTasks && queueTasks.pending + queueTasks.reserved}</TableCell>
                  <TableCell>{0}</TableCell>
                  <TableCell>{queue.friendly_name}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Grid>
    </>
  );
};

export default CustomQueueStatsView;
