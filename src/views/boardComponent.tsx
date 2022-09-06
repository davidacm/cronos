import { useEffect, useState, useId, useRef, Ref } from 'react'
import { observer } from "mobx-react-lite"
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import { blue } from '@mui/material/colors';
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay } from "@chakra-ui/react"
import { factory, IBoard, IMarkTime, ITimer, TemporalMark } from "../logic/store"
import { beepSlower, dateUtils, msToHumanTime, uuid } from '../logic/utils'
import { clone, getSnapshot } from 'mobx-state-tree';
import { DialogActions, DialogContent, DialogContentText, ListItemButton, Paper } from '@mui/material';


const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary
}))


function useToggleFocus<R extends HTMLElement>(): [boolean, () => void, Ref<R>, () => void] {
  const focusRef = useRef<R>(null)
  const [_toggle, _setToggle] = useState(false)
  const [shouldFocus, setShouldFocus] = useState(false)

  useEffect(() => {
    if (shouldFocus) {
      focusRef.current?.focus()
      setShouldFocus(false)
    }
  })
  const setFocus = () => setShouldFocus(true)
  const toggle = () => {
    if (_toggle) {
      _setToggle(false)
      setFocus()
    }
    else _setToggle(true)
  }
  return [_toggle, toggle, focusRef, setFocus]
}

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


type DialogCallback = (value: string) => void
type SimpleDialogProps = { open: boolean, title: string, labelConfirm: string, onOk: DialogCallback, onCancel: DialogCallback }
type DialogInputProps = SimpleDialogProps & { labelInput: string, initialValue?: string }

function GetInputDialog(p: DialogInputProps) {
  const idInput = useId()
  const refInput = useRef<HTMLInputElement>(null)
  let initialValue = ""
  useEffect(() => {
    if (p.initialValue) initialValue = p.initialValue
  }, [p.initialValue])
  const handleOK = () => {
    p.onOk(refInput.current!.value)
  };

  const handleCancel = () => {
    p.onCancel("")
  };
  return (
    <Dialog open={p.open} onClose={handleCancel}>
      <DialogTitle>{p.title}</DialogTitle>
      <DialogContent>
        <label htmlFor={idInput}>{p.labelInput}</label>
        <input id={idInput} autoFocus type="text" ref={refInput} defaultValue={initialValue} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleOK}>{p.labelConfirm}</Button>
      </DialogActions>
    </Dialog>
  );
}

type ConfirmDialogProps = SimpleDialogProps & { description: string }
function ConfirmDialog(p: ConfirmDialogProps) {
  const handleOK = () => {
    p.onOk("ok")
  };
  const handleCancel = () => {
    p.onCancel("cancel")
  };

  return (<Dialog open={p.open} onClose={handleCancel}>
    <DialogTitle>{p.title}</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {p.description}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button autoFocus onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleOK}>{p.labelConfirm}</Button>
    </DialogActions>
  </Dialog>)
}


function ButtonNewDialog(p: Omit<DialogInputProps, 'onCancel' | 'open' | 'id'> & { labelOpen: string }) {
  const [open, toggleOpen, focusRef] = useToggleFocus<HTMLButtonElement>()

  const handleOk = (value: string) => {
    p.onOk(value)
    toggleOpen()
  }

  if (!open) return (<Button variant="outlined" onClick={toggleOpen} ref={focusRef}>
    {p.labelOpen}
  </Button>)

  return (<GetInputDialog open={open} title={p.title} labelInput={p.title} labelConfirm={p.labelConfirm} onOk={handleOk} onCancel={toggleOpen} />)
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

  return (<span>{p.timer.name}. {duration}</span>)
})


export const TimersView = observer((p: { board: IBoard, WrapperTimer: (p: { timer: ITimer, lastMark: number | undefined, children: any }) => any }) => {
  const b = p.board
  console.log("construyendo board", uuid.getId(), b.history.length, b.lastMark?.time, b.lastMark?.timer?.id)
  const WrapperTimer = p.WrapperTimer

  return (<Stack direction={'column'} spacing='12px'>
    {b.mostRecent.map(v => {
      let l: number | undefined = undefined
      if (b.lastMark && v.id === b.lastMark.timer?.id)
        l = b.lastMark.time
      return (<Box key={v.id}>
        <WrapperTimer timer={v} lastMark={l}>
          <TimerComponent timer={v} lastMark={l} />
        </WrapperTimer>
      </Box>)
    })}
  </Stack>
  )
})


export const Stopwatch = observer((p: { board: IBoard }) => {
  const Wrapper = (wp: { timer: ITimer, lastMark: number | undefined, children: any }) => (
    <Item>
      <button
        onClick={() => toggleTimer(p.board, wp.timer, wp.lastMark)}>
        {wp.children}
      </button>
    </Item>
  )

  return (<Box sx={{ width: '100vh' }}>
    <Stack spacing={2}>
      <TimersView board={p.board} WrapperTimer={Wrapper} />
      <Item>
        <Stack spacing={2} direction='row'>
          {p.board.lastMark?.timer && (
            <Item>
              <button onClick={() => p.board.stopTimer(factory.generator.getCurrentTime())}>stop {p.board.lastMark.timer.name}</button>
            </Item>
          )}
          <Item>
            <ButtonNewDialog labelOpen='new timer' title='new Timer' labelInput='timer' labelConfirm='create' onOk={(n) => createTimer(p.board, n)} />
          </Item>
        </Stack>
      </Item>
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
          onCancel = { handleCloseDialog }
          labelConfirm ={`Delete ${wp.timer.name}`}
          onOk = {_delete}
          open = { openDialog === 2}
          />)
      default:
return (<>
  <Button ref={focusRef} onClick={toggleDrawer}>{wp.children}</Button>
  <Drawer open={openDrawer} onClick={handleKeyMouse} onKeyDown={handleKeyMouse}>
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

return (<Stack direction={'column'}>
  <TimersView board={p.board} WrapperTimer={Wrapper} />
  <ButtonNewDialog labelOpen='new timer' title='new Timer' labelInput='timer' labelConfirm='create' onOk={(n) => createTimer(p.board, n)} />
</Stack>
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
