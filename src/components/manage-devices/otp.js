import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStyletron } from 'styletron-react';
import { generateOTK } from '../../common/api.js';
import { useTheme } from '../../common/theme.js';
import { LoadingSpinner } from '../../shared/loading-spinner.js';

function OTP() {
  const [generating, setGenerating] = useState(false);
  const [otp, setOtp] = useState('');
  const [css] = useStyletron();
  const { theme } = useTheme();

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
            Here&apos;s your temporary password, enter your username and OTP on
            your device to connect it to your account.
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
            Generate One Time Password (OTP)
          </Link>
          &nbsp;to setup a new device.
        </>
      )}
    </div>
  );
}
export { OTP };
