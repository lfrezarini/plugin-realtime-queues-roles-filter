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
import { Grid } from '@material-ui/core';
import { Marker } from './CustomQueueStatsView.Styles';

const ActiveTasks = props => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.ActiveTasksTileTitle} />}
      content='0'
    />
  );
};

const WaitingTasks = props => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.WaitingTasksTileTitle} />}
      content='0'
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
        renderMarker: props => <Marker color={props.color} icon="Accept" />
      },
      {
        value: unavailableAgents,
        label: templates.AgentStatusUnavailable
          ? templates.AgentStatusUnavailable()
          : '',
        color: theme ? theme.colors.agentUnavailableColor : '',
        renderMarker: props => <Marker color={props.color} icon="Close" />
      },
      {
        value: offlineAgents,
        label: templates.AgentStatusOffline
          ? templates.AgentStatusOffline()
          : '',
        color: theme ? theme.colors.agentOfflineColor : '',
        renderMarker: props => <Marker color={props.color} icon="Minus"  />
      }
    ];

    return (
      <AggregatedDataTile
        title={<Template source={templates.AgentsByActivityTileTitle} />}
      >
        <StackedBarChart items={mappedProps} />
        <Legend items={mappedProps} labelPosition="start" showLabels />
      </AggregatedDataTile>
    );
  }
}

const Test = withTheme(AgentByActivityChart)

const CustomQueueStatsView = ({ workspaceStats }) => {
  return (
    <Grid container spacing={24} style={{ padding: '0px 16px' }}>
      <Grid item xs={3}>
        <ActiveTasks />
      </Grid>
      <Grid item xs={3}>
        <WaitingTasks />
      </Grid>
      <Grid item xs={3}>
        <LongestWaitingCall />
      </Grid>
      <Grid item xs={3}>
        <Test
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
  );
};

export default CustomQueueStatsView;
