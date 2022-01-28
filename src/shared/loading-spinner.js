import { useStyletron } from "styletron-react";

function LoadingSpinner({ size, border }) {
  const [css] = useStyletron();
  return (
    <div className={css({
      fontSize: '10px',
      position: 'relative',
      textIndent: '-9999em',
      borderTop: `${border || '1.1em'} solid rgba(29,40,48, 0.2)`,
      borderRight: `${border || '1.1em'} solid rgba(29,40,48, 0.2)`,
      borderBottom: `${border || '1.1em'} solid rgba(29,40,48, 0.2)`,
      borderLeft: `${border || '1.1em'} solid #1d2830`,
      transform: `translateZ(0)`,
      borderRadius: '50%',
      width: size || '10em',
      height: size || '10em',
      overflow: 'hidden',

      animationName: {
        '0%': {
          transform: 'rotate(0deg)',
        },
        '100%': {
          transform: 'rotate(360deg)',
        }
      },
      animationDelay: '0s',
      animationDuration: '1.1s',
      animationTimingFunction: 'linear',
      animationDelay: '0s',
      animationIterationCount: 'infinite',

      ':after': {
        content: "''",
        borderRadius: '50%',
        width: size || '10em',
        height: size || '10em',
      },
    })}>Loading...</div>
  )
}

export { LoadingSpinner };
