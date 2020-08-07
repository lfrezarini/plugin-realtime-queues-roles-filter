import React from 'react';

import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead
} from '@material-ui/core';
import { QueueTableRow } from './QueuesStatsView.Styles';
import { QueueAgents } from './QueuesStatsView.Components';

const QueueStatsView = ({ queuesList, tasksByQueues, workersByQueue }) => {
  if (!queuesList.size) {
    return <div/>
  }

  return (
    <Table style={{ tableLayout: 'auto' }}>
      <TableHead>
        <TableRow>
          <TableCell style={{ maxWidth: '200px', marginLeft: 18 }}>
            Queue
          </TableCell>
          <TableCell>Active</TableCell>
          <TableCell>Waiting</TableCell>
          <TableCell style={{ maxWidth: '20px', paddingRight: '5px' }}>
            Agents
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from(queuesList.values()).map(queue => {
          const { friendly_name, sid } = queue;
          const queueTasks = tasksByQueues.get(friendly_name);

          return (
            <QueueTableRow key={sid}>
              <TableCell
                className='queue-table-cell'
                style={{ maxWidth: '200px', paddingLeft: 18 }}
              >
                {friendly_name}
              </TableCell>
              <TableCell className='queue-table-cell'>
                {(queueTasks && queueTasks.assigned + queueTasks.wrapping)}
              </TableCell>
              <TableCell className='queue-table-cell'>
                {(queueTasks && queueTasks.pending + queueTasks.reserved)}
              </TableCell>
              <TableCell className='queue-table-cell agents-stats'>
                <QueueAgents
                  availableAgents={
                    workersByQueue.get(friendly_name) &&
                    workersByQueue.get(friendly_name).available
                  }
                  unavailableAgents={
                    workersByQueue.get(friendly_name) &&
                    workersByQueue.get(friendly_name).unavailable
                  }
                  offlineAgents={
                    workersByQueue.get(friendly_name) &&
                    workersByQueue.get(friendly_name).offline
                  }
                />
              </TableCell>
            </QueueTableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default QueueStatsView;
