import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import promptSw from '../prompt-sw';
import { ReactNode } from 'react';


interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    currentIndex: number;
}


function InternalTabPanel(props: TabPanelProps) {
    const { children, currentIndex: value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

export function TabPanel(props: {children: ReactNode}) {
    const {children, ...other} = props
    return (<div {...other}>
        {children}
        </div>)
}


function TabList() {

}

function TabPanels(props: {currentIndex: number, children: []}) {
    return (<div>{props.children[props.currentIndex]}</div>)
}

function TabContainer(props: {children: [typeof TabList, typeof TabPanels]}) {
    props.children[0].
}