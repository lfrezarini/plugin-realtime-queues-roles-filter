import React from 'react';
import WorkspaceStatsViewContainer from './WorkspaceStatsView/WorkspaceStatsView.Container';
import QueueStatsViewContainer from './QueuesStatsView/QueuesStatsView.Container';

class CustomQueueStatsViewContainer extends React.Component {
  
  render() {
    return (
      <>
        <WorkspaceStatsViewContainer {...this.props} />
        <QueueStatsViewContainer {...this.props} />
      </>
    );
  }
}

export default CustomQueueStatsViewContainer;
