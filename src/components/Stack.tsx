import { makeStyles, mergeClasses, shorthands } from '@fluentui/react-components';
import { CSSProperties } from 'react';

type StackProps = {
  direction?: NonNullable<CSSProperties['flexDirection']>;
  children?: React.ReactNode;
};

const useStyles = makeStyles({
  common: {
    display: 'flex',
    ...shorthands.gap('1em', '1em'),
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
});

export default function Stack(props: StackProps) {
  const { direction = 'column', children } = props;
  const classes = useStyles();

  return (
    <div
      className={mergeClasses(
        classes.common,
        direction === 'row' && classes.horizontal,
        direction === 'column' && classes.vertical
      )}
    >
      {children}
    </div>
  );
}
