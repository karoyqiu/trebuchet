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
import SubscriptionTable from './components/SubscriptionTable';
import db from './db';
import { Subscription } from './db/subscription';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
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

  const theme = React.useMemo(() => {
    const thm = isDarkMode ? webDarkTheme : webLightTheme;

    // 设置整个文档的背景色
    document.body.style.backgroundColor = thm.colorNeutralBackground1;

    return thm;
  }, [isDarkMode]);

  const sub = React.useCallback(async (values?: Subscription) => {
    setOpen(false);

    if (values) {
      await db.subs.add(values);
    }
  }, []);

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
      {tab === 'subs' && <SubscriptionTable />}
      <SubscriptionDialog open={open} onClose={sub} sub={emptySub} />
    </FluentProvider>
  );
}

export default App;
