import { useStyletron } from 'styletron-react';

function StatusIndicator({ available = false }) {
  const [css] = useStyletron();
  return (
    <span
      className={css({
        display: 'inline-block',
        height: '15px',
        width: '15px',
        borderRadius: '50%',
        marginLeft: '15px',
        marginTop: '-2px',
        verticalAlign: 'middle',
        backgroundColor: available ? 'darkgreen' : 'darkgray',
      })}
    />
  );
}

export { StatusIndicator };
