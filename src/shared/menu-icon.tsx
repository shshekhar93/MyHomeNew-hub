import { useMemo } from 'react';
import { useStyletron } from 'styletron-react';

export type MenuIconProps = {
  isOpen: boolean;
  onClick: () => void;
};

function MenuIcon({ isOpen, onClick }: MenuIconProps) {
  const [css] = useStyletron();

  const spanStyles = useMemo(() => {
    return SpanIndividualStyles.map((style, idx) => ({
      ...SpanCommonStyles,
      ...style,
      ...(isOpen ? SpanOpenIndividualStyles[idx] : {}),
    }));
  }, [isOpen]);

  return (
    <div className={css(ContainerStyles)} onClick={onClick}>
      {spanStyles.map((style, idx) => (
        <span key={idx} className={css(style)} />
      ))}
    </div>
  );
}

export { MenuIcon };

/* Style object definitions */
const ContainerStyles = {
  width: '32px',
  height: '24px',
  position: 'relative' as const,
  transform: 'rotate(0deg)',
  transition: '.3s ease-in-out',
  cursor: 'pointer',
};

const SpanCommonStyles = {
  display: 'block',
  position: 'absolute' as const,
  height: '5px',
  width: '100%',
  background: '#ffffff',
  borderRadius: '5px',
  opacity: '1',
  left: '0',
  transform: 'rotate(0deg)',
  transition: '.3s ease-in-out',
};

const SpanIndividualStyles = [
  { top: '0px' },
  { top: '10px' },
  { top: '10px' },
  { top: '19px' },
];

const SpanOpenIndividualStyles = [
  {
    top: '19px',
    width: '0%',
    left: '50%',
  },
  { transform: 'rotate(45deg)' },
  { transform: 'rotate(-45deg)' },
  {
    top: '10px',
    width: '0%',
    left: '50%',
  },
];
