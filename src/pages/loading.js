import { useStyletron } from 'styletron-react';

function LoadingPage() {
  const [css] = useStyletron();

  return (
    <div className={css({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    })}>
      <LoadingSpinner />
    </div>
  );
}

function LoadingSpinner() {
  const [css] = useStyletron();
  return (
    <div className={css({
      fontSize: '10px',
      position: 'relative',
      textIndent: '-9999em',
      borderTop: `1.1em solid rgba(29,40,48, 0.2)`,
      borderRight: `1.1em solid rgba(29,40,48, 0.2)`,
      borderBottom: `1.1em solid rgba(29,40,48, 0.2)`,
      borderLeft: `1.1em solid #1d2830`,
      transform: `translateZ(0)`,
      borderRadius: '50%',
      width: '10em',
      height: '10em',
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
        width: '10em',
        height: '10em',
      },
    })}>Loading...</div>
  )
}

export default LoadingPage;
export { LoadingSpinner };