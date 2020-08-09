import React from 'react';
import styled from 'react-emotion';
import { Icon } from '@twilio/flex-ui';
import { Grid } from '@material-ui/core';

const Disc = styled('dt')`
  height: 18px;
  width: 18px;
  line-height: 8px;
  border-radius: 50%;
  background-color: ${props => props.color || props.theme.calculated.textColor};
  margin-right: 8px;
  align-items: center;
  justify-content: center;
  display: flex;
  color: white;
`;

export const Marker = props => (
  <Disc color={props.color}>
    <Icon icon={props.icon} sizeMultiplier={1} />
  </Disc>
);

export const Wrapper = styled(Grid)`
  .Twilio-AggregatedDataTile {
    min-height: 109px;
  }
`;
