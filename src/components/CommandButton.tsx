import clsx from 'clsx';
import { useState, type ButtonHTMLAttributes } from 'react';

type CommandButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onClick: () => Promise<unknown>;
};

export default function CommandButton(props: CommandButtonProps) {
  const { className, disabled, onClick, ...rest } = props;
  const [busy, setBusy] = useState(false);

  return (
    <button
      className={clsx('btn', className)}
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);

        try {
          await onClick();
        } catch (e) {
          console.error(e);
        }

        setBusy(false);
      }}
      {...rest}
    />
  );
}
