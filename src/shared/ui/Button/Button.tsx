import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';
import { classNames } from '../../lib/classNames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = ({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) => {
  return (
    <button
      className={classNames(styles.button, {}, [
        styles[variant],
        className || '',
      ])}
      {...props}
    >
      {props.children}
    </button>
  );
};
