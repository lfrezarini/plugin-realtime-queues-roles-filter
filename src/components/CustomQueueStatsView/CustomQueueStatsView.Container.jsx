import React from 'react';
import WorkspaceStatsViewContainer from './WorkspaceStatsView/WorkspaceStatsView.Container';
import QueueStatsViewContainer from './QueuesStatsView/QueuesStatsView.Container';

const CustomQueueStatsViewContainer = (props) => {
  return (
    <>
      <div>
        <WorkspaceStatsViewContainer {...props} />
      </div>
      <div style={{ marginTop: 48 }}>
        <QueueStatsViewContainer {...props} />
      </div>
    </>
  );
};

export default CustomQueueStatsViewContainer;
