import { useEffect, useState } from 'react'
import {Tabs, TabList, TabPanels, Tab, TabPanel} from "@chakra-ui/react"
import reactLogo from './assets/react.svg'
import './App.css'
import { beepSlower } from "./logic/utils"
import { EditTimers, LogView, Stopwatch } from "./views/boardComponent"
import { ITimer, factory, store } from "./logic/store"
// window.store = store

function App() {
  return (
    <div className="App">
      <Tabs isManual isLazy>
        <TabList>
          <Tab>Stopwatch</Tab>
          <Tab>Edit timers / boards</Tab>
          <Tab>Activity log</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Stopwatch board={store.currentBoard!}/>
          </TabPanel>
          <TabPanel>
            <EditTimers board={store.currentBoard!} />
          </TabPanel>
          <TabPanel>
            <LogView board={store.currentBoard!} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}

export default App
