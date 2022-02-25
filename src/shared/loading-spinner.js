import { useStyletron } from 'styletron-react';
import { useTranslations } from '../common/i18n.js';

function LoadingSpinner({
  size = '10em',
  border = '1.1em',
  color = '#1d2830',
  borderColor = 'rgba(29,40,48, 0.2)',
}) {
  const translate = useTranslations();
  const [css] = useStyletron();
  return (
    <div
      className={css({
        fontSize: '10px',
        position: 'relative',
        textIndent: '-9999em',
        borderTop: `${border} solid ${borderColor}`,
        borderRight: `${border} solid ${borderColor}`,
        borderBottom: `${border} solid ${borderColor}`,
        borderLeft: `${border} solid ${color}`,
        transform: `translateZ(0)`,
        borderRadius: '50%',
        width: size,
        height: size,
        overflow: 'hidden',

        animationName: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg)',
          },
        },
        animationDelay: '0s',
        animationDuration: '1.1s',
        animationTimingFunction: 'linear',
        animationDelay: '0s',
        animationIterationCount: 'infinite',

        ':after': {
          content: "''",
          borderRadius: '50%',
          width: size,
          height: size,
        },
      })}
    >
      {translate('loading') || 'Loading...'}
    </div>
  );
}

export { LoadingSpinner };
