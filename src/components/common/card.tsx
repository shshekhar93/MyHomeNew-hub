import React from "react";
import { useStyletron } from "styletron-react";
import { useTheme } from "../../common/theme";

export type CardProps = {
  title: React.ReactNode;
  expandable?: boolean;
  expandedByDefault?: boolean;
};
export function Card({ title, children }: React.PropsWithChildren<CardProps>) {
  const { theme } = useTheme();
  const [css] = useStyletron();
  return (
    <div className={css({
      backgroundColor: theme.contrastBackground,
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
    })}>
      <h4 className={css({ marginTop: 0 })}>{title}</h4>
      <div>{children}</div>
    </div>
  );
}