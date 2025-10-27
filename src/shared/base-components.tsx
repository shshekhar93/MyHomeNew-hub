import { AccordionItem, AccordionItemButton } from 'react-accessible-accordion';
import { styled } from 'styletron-react';
import { type ThemeT, useTheme } from '../common/theme';
import { ComponentProps, ComponentType, ElementType } from 'react';
import type { StyletronComponent } from 'styletron-react';

/**
 * Higher order component that provides the current theme to
 * the wrapped component, along with all passed props.
 *
 * @param {ComponentType} Component - The component to be wrapped
 * @return {ComponentType} - The new wrapped component.
 */

const withTheme = <T,>(Component: ComponentType<T & { $theme: ThemeT }>) => {
  return (props: T) => {
    const { theme } = useTheme();
    return <Component {...props} $theme={theme} />;
  };
};

const PageHeading = styled('h1', {
  marginTop: 0,
});

const createInputStyles = ({ $theme, hasError }: {
  $theme: ThemeT;
  hasError?: boolean;
}) => ({
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '1rem',
  outline: '0',
  border: `1px solid ${hasError ? $theme.error : $theme.border}`,
  borderRadius: '5px',

  ':focus': {
    borderColor: $theme.borderFocus,
    boxShadow: '0 0 0 0.2rem rgb(0 50 50 / 25%)',
  },
});
const Input = withTheme(styled('input', createInputStyles)) as StyletronComponent<ElementType<unknown, 'input'>, ComponentProps<'input'> & { hasError?: boolean }>;
const Textarea = withTheme(styled('textarea', createInputStyles)) as StyletronComponent<ElementType<unknown, 'textarea'>, ComponentProps<'textarea'> & { hasError?: boolean }>;
const Select = withTheme(styled('select', createInputStyles)) as StyletronComponent<ElementType<unknown, 'select'>, ComponentProps<'select'>>;

const InputLabel = styled('label', {
  display: 'block',
  marginBottom: '1rem',

  ':last-child': {
    marginBottom: 0,
  },
});

const InputLabelText = styled('p', {
  margin: '0 0 0.5rem',
});

const Button = withTheme(
  styled('button', ({ $size, $theme, disabled }: {
    $size?: 'default' | 'expand';
    $theme: ThemeT;
    disabled?: boolean;
  }) => ({
    width: $size === 'expand' ? '100%' : undefined,
    padding: '0.75rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    color: '#fff',
    background: disabled ? '#969696' : $theme.accent,

    ':hover': {
      background: disabled ? '#969696' : $theme.accentDark,
    },
  })),
) as StyletronComponent<ElementType<unknown, 'button'>, ComponentProps<'button'> & { $size?: 'default' | 'expand' }>;

const StyledAccordionItem = withTheme(
  styled(AccordionItem, ({ $theme }: { $theme: ThemeT }) => ({
    border: `1px solid ${$theme.border}`,
    padding: '0.5rem 0.75rem',
    marginBottom: '1rem',

    ':last-child': {
      marginBottom: 0,
    },
  })),
);

const StyledAccordionItemButton = styled(AccordionItemButton, () => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '1.25rem',
  cursor: 'pointer',

  ':after': {
    content: '\'\'',
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderBottom: '2px solid currentColor',
    borderRight: '2px solid currentColor',
    marginRight: '12px',
    transform: 'rotate(-45deg) translate(-3px, -3px)',
  },
}));

export {
  PageHeading,
  Input,
  Textarea,
  Select,
  InputLabel,
  InputLabelText,
  Button,
  StyledAccordionItem,
  StyledAccordionItemButton,
};
