import {
  FluentProvider,
  Tab,
  TabList,
  TabValue,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
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
  toolbar: {
    justifyContent: 'space-between',
  },
});

const emptySub: Subscription = {
  name: '',
  url: '',
};

function App() {
  const [tab, setTab] = React.useState<TabValue>('subs');
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
      <Toolbar className={classes.toolbar}>
        <ToolbarGroup>
          <TabList selectedValue={tab} onTabSelect={(_event, data) => setTab(data.value)}>
            <Tab value="ep">Endpoints</Tab>
            <Tab value="subs">Subscriptions</Tab>
          </TabList>
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarButton icon={<AddFilled />} onClick={() => setOpen(true)}>
            Subscribe
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
      <SubscriptionDialog open={open} onClose={() => setOpen(false)} sub={emptySub} />
    </FluentProvider>
  );
}

export default App;
