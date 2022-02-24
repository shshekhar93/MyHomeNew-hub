import { useStyletron } from 'styletron-react';
import { useTheme } from '../../common/theme';

const DEFAULT_TITLE = {
  SERVER_ERROR: 'Something went wrong',
  NOT_FOUND: 'Uh oh! Nothing was found here.',
};

const DEFAULT_MESSAGE = {
  SERVER_ERROR: 'We could not process your request, please try again.',
  NOT_FOUND:
    'You could have followed a broken link. Please return to home page.',
};

function ErrorPage({ type = 'SERVER_ERROR', title, message }) {
  const [css] = useStyletron();
  const { theme } = useTheme();

  return (
    <div
      className={css({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      })}
    >
      <h1 className={css({ color: theme.error })}>
        <span
          className={css({
            borderRadius: '50%',
            width: '1.5em',
            display: 'inline-flex',
            justifyContent: 'center',
            color: 'white',
            marginRight: '1rem',
            backgroundColor: theme.error,
          })}
        >
          !
        </span>
        {title || DEFAULT_TITLE[type]}
      </h1>
      <p>{message || DEFAULT_MESSAGE[type]}</p>
    </div>
  );
}

export { ErrorPage };
