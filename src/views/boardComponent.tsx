import { Box, Button, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material'
import { Add as AddIcon, Stop as StopIcon, TimelapseRounded } from '@mui/icons-material'
import { observer } from "mobx-react-lite"
import { useEffect, useRef, useState } from 'react'

import { ButtonNewDialog, ConfirmDialog, GetInputDialog, Item, useToggleFocus } from "./components"

import { factory, IBoard, IMarkTime, ITimer, TemporalMark } from "../logic/store"
import { dateUtils, msToHumanTime, uuid } from '../logic/utils'


function createTimer(board: IBoard, name: string) {
  board.addTimer(factory.createTimer(name, board.id))
}

function deleteTimer(board: IBoard, timer: ITimer) {
  board.deleteTimer(timer.id)
}

function renameTimer(timer: ITimer, name: string) {
  timer.setName(name)
}

function toggleTimer(board: IBoard, t: ITimer, lastMark: number | undefined) {
  const time = factory.generator.getCurrentTime()
  if (lastMark) board.stopTimer(time)
  else board.startTimer(t, time)
}




export const TimerComponent = observer((p: { timer: ITimer, lastMark: number | undefined }) => {
  const [duration, setDuration] = useState(msToHumanTime(p.timer.lastDuration))
  useEffect(() => {
    if (p.lastMark) {
      setDuration(msToHumanTime(0))
      let iv = setInterval(() => p.lastMark && setDuration(msToHumanTime(Date.now() - p.lastMark)), 1000)
      return () => clearInterval(iv)
    }
    setDuration(msToHumanTime(p.timer.lastDuration))
    return undefined
  }, [p.lastMark])

  return (<>{p.timer.name}. {duration}</>)
})

type WrapperTimerNode = (p: { timer: ITimer, lastMark: number | undefined, children: any }) => any
export const TimersView = observer((p: { board: IBoard, WrapperTimer: WrapperTimerNode }) => {
  const { board, WrapperTimer } = p

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 100000
      console.log("actualizando scroll", uuid.getId())
    }
  })
  console.log("construyendo board", uuid.getId(), board.history.length, board.lastMark?.time, board.lastMark?.timer?.id)

  return (<Box style={{ maxHeight: 500, overflow: 'auto' }} ref={listRef}>
    <List>
      {board.mostRecent.map(v => {
        let l: number | undefined = undefined
        if (board.lastMark && v.id === board.lastMark.timer?.id)
          l = board.lastMark.time
        return (<ListItem key={v.id} sx={{ width: '100vw' }}>
          <WrapperTimer timer={v} lastMark={l}>
            <TimerComponent timer={v} lastMark={l} />
          </WrapperTimer>
        </ListItem>)
      })}
    </List>
  </Box>
  )
})


export const TimersFooter = observer((p: { board: IBoard }) => {
  return (<>
    <Divider />
    <Stack spacing={2} direction='row' sx={{ width: '100%' }}>
      {p.board.lastMark?.timer && (
        <Button onClick={() => p.board.stopTimer(factory.generator.getCurrentTime())} startIcon={<StopIcon />}>
          stop {p.board.lastMark.timer.name}
        </Button>
      )}
      <ButtonNewDialog labelOpen='new timer' title='new Timer' labelInput='timer name' labelConfirm='create' onOk={(n) => createTimer(p.board, n)} />
    </Stack>
  </>)
})


export const Stopwatch = observer((p: { board: IBoard }) => {
  const Wrapper = (wp: { timer: ITimer, lastMark: number | undefined, children: any }) => (
    <ListItemButton autoFocus={wp.lastMark !== undefined}
      onClick={() => toggleTimer(p.board, wp.timer, wp.lastMark)}>
      {wp.lastMark !== undefined && (<ListItemIcon><TimelapseRounded /></ListItemIcon>)}
      <ListItemText>
        {wp.children}
      </ListItemText>
    </ListItemButton>
  )

  return (<Box sx={{ width: '100vw', position: 'fixed', bottom: 0 }}>
    <Stack spacing={2}>
      <Box>
        <TimersView board={p.board} WrapperTimer={Wrapper} />
      </Box>
      <TimersFooter board={p.board} />

    </Stack>
  </Box>
  )
})

export const EditTimers = observer((p: { board: IBoard }) => {

  const Wrapper = (wp: { timer: ITimer, lastMark: number | undefined, children: any }) => {
    const [openDrawer, toggleDrawer, focusRef, setFocus] = useToggleFocus<HTMLButtonElement>()
    const [openDialog, setOpenDialog] = useState(0)

    const handleCloseDialog = () => {
      setOpenDialog(0)
      setFocus()
    }

    const rename = (v: string) => {
      renameTimer(wp.timer, v)
      handleCloseDialog()
    }

    const _delete = (v: string) => {
      deleteTimer(p.board, wp.timer)
      handleCloseDialog()
    }

    const handleKeyMouse = (event: React.KeyboardEvent | React.MouseEvent) => {
      if (event.type === 'keydown') {
        const key = (event as React.KeyboardEvent).key
        if (key !== 'Escape') return
      }
      toggleDrawer()
    };

    switch (openDialog) {
      case 1:
        return (<GetInputDialog title={`Rename timer ${wp.timer.name}`} labelInput='Timer name' onCancel={handleCloseDialog} labelConfirm='rename' onOk={rename} open={openDialog === 1} initialValue={wp.timer.name} />)
      case 2:
        return (<ConfirmDialog
          title={`Delete timer ${wp.timer.name}?`}
          description={`Are you sure to delete the timer ${wp.timer.name}? This action will delete this timer and it's related activity. This action can't be undone`}
          onCancel={handleCloseDialog}
          labelConfirm={`Delete ${wp.timer.name}`}
          onOk={_delete}
          open={openDialog === 2}
        />)
      default:
        return (<>
          <Button ref={focusRef} onClick={toggleDrawer} aria-expanded={false}>{wp.children}</Button>
          <Drawer open={openDrawer} onClick={handleKeyMouse} onKeyDown={handleKeyMouse} >
            <List>
              <ListItem disablePadding>
                <ListItemButton autoFocus onClick={() => setOpenDialog(1)}>
                  <ListItemText primary="Rename" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => setOpenDialog(2)}>
                  <ListItemText primary="Delete" />
                </ListItemButton>
              </ListItem>
            </List>
          </Drawer>
        </>)
    }
  }

  return (<Box sx={{ width: '100vw' }}>
    <Stack spacing={2}>
      <Box style={{ maxHeight: 500, overflow: 'auto', position: 'fixed', bottom: 35 }}>
        <List style={{}}>
          <TimersView board={p.board} WrapperTimer={Wrapper} />
        </List>
      </Box>
      <Box style={{ maxHeight: 25, position: 'fixed', bottom: 0, width: '100%' }}>
        <Divider />
        <Stack spacing={2} direction='row'>
          {p.board.lastMark?.timer && (
            <Box>
              <button onClick={() => p.board.stopTimer(factory.generator.getCurrentTime())}>stop {p.board.lastMark.timer.name}</button>
            </Box>
          )}
          <Box>
            <ButtonNewDialog labelOpen='new timer' title='new Timer' labelInput='timer' labelConfirm='create' onOk={(n) => createTimer(p.board, n)} />
          </Box>
        </Stack>
      </Box>
    </Stack>
  </Box>
  )
})

export const MarkTimeEntry = observer((p: { startMark: IMarkTime, endMark: IMarkTime | undefined }) => {
  const [endTime, setEndTime] = useState(p.endMark ? p.endMark.time : factory.generator.getCurrentTime())

  useEffect(() => {
    if (!p.endMark) {
      let iv = setInterval(() => setEndTime(Date.now()), 1000)
      return () => clearInterval(iv)
    }
    return undefined
  }, [p.endMark])

  return (<span>{p.startMark.timer!.name}: {msToHumanTime(endTime - p.startMark.time)}</span>)
})

export const LogView = observer((p: { board: IBoard }) => {
  // temporally just can see one day.
  const [startDate, setStartDate] = useState(dateUtils.getCurrentStartDay)
  const [endDate, setEndDate] = useState(dateUtils.sumDay(startDate, 1))
  const logRange = p.board.getHistoryBetween(startDate.getTime(), endDate.getTime())
  if (!logRange) return null

  console.log("tamanio history", logRange.length)
  const prev = p.board.getPrevMark(startDate.getTime())
  // if a mark time is before the current start day, count the time from the start of the current day.
  if (prev && prev.timer) {
    console.log("prev is available")
    const m = new TemporalMark(dateUtils.getCurrentStartDay().getTime(), prev.timer)
    logRange.unshift(m)
  }
  const items = []
  for (let i = 0; i < logRange!.length - 1; ++i) {
    if (!logRange[i].timer) continue
    items.push((<Item key={i}><MarkTimeEntry startMark={logRange[i]} endMark={logRange[i + 1]} /></Item>))
  }
  console.log("ztamanio items", items.length)
  // if the last timer is still not stopped, render it with undefined endMark
  const last = logRange.at(-1)
  if (last && last!.timer)
    items.push((<Item key='-1'><MarkTimeEntry startMark={last} endMark={undefined} /></Item>))
  console.log("ztamanio 2 items", items.length)
  return (<Box sx={{ width: '100vh' }}>
    <Stack spacing={2}>
      {items}
    </Stack>
  </Box>)
})
