import clsx from 'clsx';
import { CustomContentProps, SnackbarContent } from 'notistack';
import React from 'react';

const Alert = React.forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => {
  const { message, variant, style } = props;

  const { className, icon } = React.useMemo(() => {
    let className: string | null = null;
    let icon: React.ReactNode = <span className="material-symbols-outlined">{variant}</span>;

    switch (variant) {
      case 'info':
        className = 'alert-info';
        break;
      case 'success':
        className = 'alert-success';
        icon = <span className="material-symbols-outlined">check_circle</span>;
        break;
      case 'warning':
        className = 'alert-warning';
        break;
      case 'error':
        className = 'alert-error';
        break;
      case 'default':
      default:
        icon = null;
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
