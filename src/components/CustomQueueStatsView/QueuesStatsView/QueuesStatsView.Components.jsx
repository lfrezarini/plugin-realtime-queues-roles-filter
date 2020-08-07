import React from 'react';
import { withTheme, templates, Legend } from '@twilio/flex-ui';
import { Marker } from '../WorkspaceStatsView/WorkspaceStatsView.Styles';

export const QueueAgents = withTheme(
  ({
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
        label: templates.AgentStatusOffline
          ? templates.AgentStatusOffline()
          : '',
        color: theme ? theme.colors.agentOfflineColor : '',
        renderMarker: props => <Marker color={props.color} icon='Minus' />
      }
    ];

    return <Legend items={mappedProps} showLabels={false} />;
  }
);
