import clsx from 'clsx';
import { NavLink, NavLinkProps } from 'react-router-dom';

type LinkMenuItemProps = NavLinkProps;

export default function LinkMenuItem(props: LinkMenuItemProps) {
  const { children, ...rest } = props;

  return (
    <NavLink className={({ isActive }) => clsx(isActive && 'active')} {...rest}>
      {children}
    </NavLink>
  );
}
