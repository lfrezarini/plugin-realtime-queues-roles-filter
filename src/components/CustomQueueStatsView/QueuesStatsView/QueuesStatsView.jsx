import React from 'react';

import {
  Grid,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead
} from '@material-ui/core';
import { templates, Legend, withTheme } from '@twilio/flex-ui';
import { Marker } from '../WorkspaceStatsView/WorkspaceStatsView.Styles';

class QueueAgents extends React.Component {
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

    return <Legend items={mappedProps} showLabels={false} />;
  }
}

const ThemedQueuesAgent = withTheme(QueueAgents);

const QueueStatsView = ({ queuesList, tasksByQueues, workersByQueue }) => {
  return (
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
            const { friendly_name, sid } = queue;
            const queueTasks = tasksByQueues.get(friendly_name);

            console.log(workersByQueue)
            return (
              <TableRow key={sid}>
                <TableCell>{friendly_name}</TableCell>
                <TableCell>
                  {(queueTasks &&
                    (queueTasks.assigned || 0) + (queueTasks.wrapping || 0)) ||
                    0}
                </TableCell>
                <TableCell>
                  {(queueTasks &&
                    (queueTasks.pending || 0) + (queueTasks.reserved || 0)) ||
                    0}
                </TableCell>
                <TableCell>{0}</TableCell>
                <TableCell>
                  <ThemedQueuesAgent 
                    availableAgents={workersByQueue.get(friendly_name) && workersByQueue.get(friendly_name).available} 
                    unavailableAgents={workersByQueue.get(friendly_name) && workersByQueue.get(friendly_name).unavailable}
                    offlineAgents={workersByQueue.get(friendly_name) && workersByQueue.get(friendly_name).offline} 
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Grid>
  );
};

export default QueueStatsView;
