import { useStyletron } from 'styletron-react';
import { useTranslations } from '../../common/i18n';
import { useTheme } from '../../common/theme';

const DEFAULT_TITLE = {
  SERVER_ERROR: 'errors.server-error.title',
  NOT_FOUND: 'errors.not-found.title',
};

const DEFAULT_MESSAGE = {
  SERVER_ERROR: 'errors.server-error.message',
  NOT_FOUND: 'errors.not-found.message',
};

function ErrorPage({ type = 'SERVER_ERROR', title, message }) {
  const [css] = useStyletron();
  const { theme } = useTheme();
  const translate = useTranslations();

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
        {title || translate(DEFAULT_TITLE[type])}
      </h1>
      <p>{message || translate(DEFAULT_MESSAGE[type])}</p>
    </div>
  );
}

export { ErrorPage };
