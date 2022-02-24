import { useStyletron } from 'styletron-react';
import { LoadingSpinner } from '../shared/loading-spinner.js';

function LoadingPage() {
  const [css] = useStyletron();

  return (
    <div
      className={css({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      })}
    >
      <LoadingSpinner />
    </div>
  );
}

export default LoadingPage;
