import React from 'react';
import { StyleObject, useStyletron } from 'styletron-react';

export type BadgeTypes = 'positive' | 'information' | 'warning' | 'negative';

export type BadgeProps = {
  type: BadgeTypes;
  $style?: StyleObject;
};

const Colors = {
  positive: {
    background: '#126c00',
    color: '#b2ffb2',
  },
  information: {
    background: '#484898',
    color: '#c8f8f8',
  },
  warning: {
    background: '#ffa500',
    color: '#805000',
  },
  negative: {
    background: '#e50000',
    color: '#ffcece',
  },
};

export function Badge({
  type,
  $style,
  children,
}: React.PropsWithChildren<BadgeProps>) {
  const [css] = useStyletron();
  return (
    <div className={css({
      display: 'inline-flex',
      padding: '2px 0.5rem 4px',
      borderRadius: '10px',
      margin: '0 0.5rem',
      fontSize: '0.875rem',
      ...Colors[type],
      ...$style, // Overrides
    })}
    >
      {children}
    </div>
  );
}
