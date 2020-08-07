import React from 'react';

import {
  AggregatedDataTile,
  Template,
  templates,
  StackedBarChart,
  Legend,
  withTheme
} from '@twilio/flex-ui';
import { Marker } from './WorkspaceStatsView.Styles';

export const ActiveTasks = ({ count }) => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.ActiveTasksTileTitle} />}
      content={count}
    />
  );
};

export const WaitingTasks = ({ count }) => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.WaitingTasksTileTitle} />}
      content={count}
    />
  );
};

export const LongestWaitingCall = () => {
  return (
    <AggregatedDataTile
      title={<Template source={templates.LongestWaitTimeTileTitle} />}
      content='0'
    />
  );
};

export const AgentByActivityChart = withTheme(({
  availableAgents = 0,
  unavailableAgents = 0,
  offlineAgents = 0,
  theme
}) => {
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
      label: templates.AgentStatusOffline ? templates.AgentStatusOffline() : '',
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
});
