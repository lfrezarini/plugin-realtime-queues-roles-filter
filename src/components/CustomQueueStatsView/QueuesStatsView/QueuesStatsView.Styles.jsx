import styled from 'react-emotion';
import { TableRow } from '@material-ui/core';

export const QueueTableRow = styled(TableRow)`
  .queue-table-cell {
    font-weight: 700 !important;
    font-size: 12px !important;
  }

  .agents-stats {
    width: 193px;
  }

  .agents-stats > div {
    width: 146px;
  }
`;
