import React from 'react';

import {
  Grid,
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHead
} from '@material-ui/core';

const QueueStatsView = ({
  queuesList,
  tasksByQueues
}) => {
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
            const { friendly_name, sid, tasks_by_status } = queue;
            const queueTasks = tasksByQueues.get(friendly_name);

            return (
              <TableRow key={sid}>
                <TableCell>{friendly_name}</TableCell>
                <TableCell>
                  {queueTasks && (queueTasks.assigned || 0) + (queueTasks.wrapping || 0) || 0}
                </TableCell>
                <TableCell>
                  {queueTasks && (queueTasks.pending || 0) + (queueTasks.reserved || 0) || 0}
                </TableCell>
                <TableCell>{0}</TableCell>
                <TableCell>{queue.friendly_name}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Grid>
  );
};

export default QueueStatsView;
