import { Box, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputLabel, styled, TextField } from '@mui/material'
import { Ref, useEffect, useId, useRef, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'


export function useToggleFocus<R extends HTMLElement>(): [boolean, () => void, Ref<R>, () => void] {
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


export const Item = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary
}))


type DialogCallback = (value: string) => void
type SimpleDialogProps = { open: boolean, title: string, labelConfirm: string, onOk: DialogCallback, onCancel: DialogCallback }
type DialogInputProps = SimpleDialogProps & { labelInput: string, initialValue?: string }

export function GetInputDialog(p: DialogInputProps) {
    const idInput = useId()
    const refInput = useRef<HTMLInputElement>(null)
    const handleOK = () => {
        p.onOk(refInput.current!.value)
    };

    const handleCancel = () => {
        p.onCancel("")
    };
    return (
        <Dialog open={p.open} onClose={handleCancel} fullWidth>
            <DialogTitle>{p.title}</DialogTitle>
            <DialogContent sx={{ height: 300 }}>
                <InputLabel htmlFor={idInput} >{p.labelInput}</InputLabel>
                <TextField id={idInput} fullWidth autoFocus type="text" ref={refInput} defaultValue={p.initialValue} />
            </DialogContent>
            <DialogActions sx={{ width: '100vw', position: 'fixed', bottom: 0 }}>
                <ButtonGroup fullWidth size='large'>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleOK}>{p.labelConfirm}</Button>
                </ButtonGroup>
            </DialogActions>
        </Dialog >
    );
}

type ConfirmDialogProps = SimpleDialogProps & { description: string }
export function ConfirmDialog(p: ConfirmDialogProps) {
    const handleOK = () => {
        p.onOk("ok")
    };
    const handleCancel = () => {
        p.onCancel("cancel")
    };

    return (<Dialog open={p.open} onClose={handleCancel} fullWidth>
        <DialogTitle>{p.title}</DialogTitle>
        <DialogContent>
            <DialogContentText>
                {p.description}
            </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ width: '100vw', position: 'fixed', bottom: 0 }}>
            <ButtonGroup fullWidth size='large'>
                <Button autoFocus onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleOK}>{p.labelConfirm}</Button>
            </ButtonGroup>
        </DialogActions>
    </Dialog>)
}


export function ButtonNewDialog(p: Omit<DialogInputProps, 'onCancel' | 'open'> & { labelOpen: string }) {
    const [open, toggleOpen, focusRef] = useToggleFocus<HTMLButtonElement>()

    const handleOk = (value: string) => {
        p.onOk(value)
        toggleOpen()
    }

    if (!open) return (<Button sx={{ width: '100%' }} onClick={toggleOpen} ref={focusRef}>
        {p.labelOpen}
    </Button>)

    return (<GetInputDialog open={open} title={p.title} labelInput={p.labelInput} labelConfirm={p.labelConfirm} onOk={handleOk} onCancel={toggleOpen} />)
}



