import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStyletron } from 'styletron-react';
import { generateOTK } from '../../common/api';
import { useTranslations } from '../../common/i18n';
import { useTheme } from '../../common/theme';
import { LoadingSpinner } from '../../shared/loading-spinner';

function OTP() {
  const [generating, setGenerating] = useState(false);
  const [otp, setOtp] = useState('');
  const [css] = useStyletron();
  const { theme } = useTheme();
  const translate = useTranslations();

  const generate = useCallback(async () => {
    setOtp('');
    setGenerating(true);
    const { otk } = await generateOTK();
    setOtp(otk);
    setGenerating(false);
  }, []);

  return (
    <div>
      {otp && (
        <div
          className={css({
            border: `1px solid ${theme.border}`,
            padding: '1rem',
            marginBottom: '1rem',
          })}
        >
          <p className={css({ margin: '0 0 0.5rem' })}>
            {translate('setup-device.otp-instruction')}
          </p>
          <p
            className={css({
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              wordBreak: 'break-all',
              margin: 0,
            })}
          >
            {otp}
          </p>
        </div>
      )}
      {generating ? (
        <LoadingSpinner size="2.5em" border="0.3em" />
      ) : (
        <>
          <Link to="#" onClick={generate}>
            {translate('setup-device.otp-cta')}
          </Link>
          {translate('setup-device.otp-cta-suffix')}
        </>
      )}
    </div>
  );
}
export { OTP };
