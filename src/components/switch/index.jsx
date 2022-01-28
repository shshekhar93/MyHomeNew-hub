import React from 'react';
import { useStyletron } from 'styletron-react';
import './switch.less';

export default function Switch(props){
  const [css] = useStyletron();

  return (
    <label className={css({
      position: 'relative',
      width: '40px',
      height: '24px',
      cursor: 'pointer',
      transform: 'scale(1.25)',
    })}>
      <input
        className={css({
          display: 'none',
        })}
        name={props.name}
        type="checkbox"
        onChange={ props.onChange }
        checked={props.checked} />
      <span className={css({
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: props.checked? '#28a745' : '#bcbcbc',
        transition: '0.4s',
        borderRadius: '15px',

        ':before': {
          content: "''",
          position: 'absolute',
          top: '4px',
          left: '4px',
          backgroundColor: '#eee',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          transition: '.4s',
          transform: props.checked? 'translateX(16px)': undefined,
      }
      })}></span>
    </label>
  );
};
