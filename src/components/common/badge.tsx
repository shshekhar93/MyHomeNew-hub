import React from "react";
import { StyleObject, useStyletron } from "styletron-react";

export type BadgeTypes = 'positive' | 'information' | 'warning' | 'negative';

export type BadgeProps = {
  type: BadgeTypes;
  $style?: StyleObject;
};

const Colors = {
  positive: {
    background: 'green',
    color: 'lightgreen',
  },
  information: {
    background: 'blue',
    color: 'lightblue',
  },
  warning: {
    background: 'orange',
    color: '#805000',
  },
  negative: {
    background: 'red',
    color: '#ffcece',
  }
};

export function Badge({
  type,
  $style,
  children
}: React.PropsWithChildren<BadgeProps>) {
  const [css] = useStyletron();
  return (
    <div className={css({
      display: 'inline-flex',
      padding: '2px 0.5rem 4px',
      borderRadius: '10px',
      margin: '0 0.5rem',
      ...Colors[type],
      ...$style, // Overrides
    })}>
      {children}
    </div>
  )
}
