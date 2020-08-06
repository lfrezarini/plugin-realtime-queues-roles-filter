import React from 'react';
import WorkspaceStatsViewContainer from './WorkspaceStatsView/WorkspaceStatsView.Container';
import QueueStatsViewContainer from './QueuesStatsView/QueuesStatsView.Container';

class CustomQueueStatsViewContainer extends React.Component {
  
  render() {
    return (
      <>
        <div>
          <WorkspaceStatsViewContainer {...this.props} />
        </div>
        <div style={{marginTop: 48}}>
          <QueueStatsViewContainer {...this.props} />
        </div>
      </>
    );
  }
}

export default CustomQueueStatsViewContainer;
