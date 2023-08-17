import {
  FluentProvider,
  Toolbar,
  ToolbarButton,
  makeStyles,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components';
import { AddFilled } from '@fluentui/react-icons';
import { appWindow } from '@tauri-apps/api/window';
import React from 'react';
import { useDarkMode } from 'usehooks-ts';
import SubscriptionDialog from './components/SubscriptionDialog';
import { Subscription } from './db/subscription';

const useStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
});

const emptySub: Subscription = {
  name: '',
  url: '',
};

function App() {
  const [open, setOpen] = React.useState(false);
  const { isDarkMode } = useDarkMode();
  const classes = useStyles();

  const theme = React.useMemo(() => (isDarkMode ? webDarkTheme : webLightTheme), [isDarkMode]);

  // 加载完成之后再显示窗口
  React.useEffect(() => {
    appWindow.show().catch(() => {});
  }, []);

  return (
    <FluentProvider className={classes.root} theme={theme}>
      <Toolbar>
        <ToolbarButton icon={<AddFilled />} onClick={() => setOpen(true)}>
          Subscribe
        </ToolbarButton>
      </Toolbar>
      <SubscriptionDialog open={open} onClose={() => setOpen(false)} sub={emptySub} />
    </FluentProvider>
  );
}

export default App;
