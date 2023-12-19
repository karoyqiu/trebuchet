import CheckCircleIcon from '@material-symbols/svg-400/outlined/check_circle.svg?react';
import ErrorIcon from '@material-symbols/svg-400/outlined/error.svg?react';
import InfoIcon from '@material-symbols/svg-400/outlined/info.svg?react';
import WarningIcon from '@material-symbols/svg-400/outlined/warning.svg?react';
import clsx from 'clsx';
import { CustomContentProps, SnackbarContent } from 'notistack';
import React from 'react';

const Alert = React.forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => {
  const { message, variant, style } = props;

  const { className, icon } = React.useMemo(() => {
    let className: string | null = null;
    let icon: React.ReactNode = null;

    switch (variant) {
      case 'info':
        className = 'alert-info';
        icon = <InfoIcon />;
        break;
      case 'success':
        className = 'alert-success';
        icon = <CheckCircleIcon />;
        break;
      case 'warning':
        className = 'alert-warning';
        icon = <WarningIcon />;
        break;
      case 'error':
        className = 'alert-error';
        icon = <ErrorIcon />;
        break;
      case 'default':
      default:
        break;
    }

    return { className, icon };
  }, [variant]);

  return (
    <SnackbarContent ref={ref} role="alert" style={style}>
      <div className={clsx('alert', className)}>
        {icon}
        <span>{message}</span>
      </div>
    </SnackbarContent>
  );
});

Alert.displayName = 'Alert';

export default Alert;
