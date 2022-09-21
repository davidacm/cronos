import { useEffect, useState, SyntheticEvent } from 'react'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import Container from '@mui/material/Container';

import './App.css'
import { beepSlower } from "./logic/utils"
import { EditTimers, LogView, Stopwatch, SummaryView } from "./views/boardComponent"
import { ITimer, factory, store } from "./logic/store"

// window.store = store


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}


function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

function App() {
  const [value, setValue] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className="App">
      <Container maxWidth="sm">
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', position:'fixed', top:10, maxHeight:20}}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
              <Tab label="stopwatch" {...a11yProps(0)} />
              <Tab label="edit timers" {...a11yProps(1)} />
              <Tab label="activity log" {...a11yProps(2)} />
              <Tab label="Summary" {...a11yProps(3)} />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0} >
            <Stopwatch board={store.currentBoard!} />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <EditTimers board={store.currentBoard!} />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <LogView board={store.currentBoard!} />
          </TabPanel>
          <TabPanel value={value} index={3} >
            <SummaryView board={store.currentBoard!} />
          </TabPanel>
        </Box>
      </Container>
    </div>
  )
}

export default App
