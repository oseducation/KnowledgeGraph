import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import Box from '@mui/material/Box';

import {Container} from "@mui/material";

import FooterContainer from "./Footer";
import App from "./App";
import {AppTheme} from "./ThemeOptions";
import Header from "./components/header";
import {DrawerProvider} from './context/drawer_provider';

const theme = createTheme(AppTheme);

export default function AppLayout() {
    return (
        <ThemeProvider theme={theme}>
            <DrawerProvider>
                <Box
                    sx={{
                        direction: 'column',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '100vh',
                        maxWidth: 'false',
                    }}
                >
                    <Header/>
                    <CssBaseline/>
                    <Container
                        component="main"
                        maxWidth={false}
                        disableGutters
                    >
                        <App/>
                    </Container>
                    <FooterContainer/>
                </Box>
            </DrawerProvider>
        </ThemeProvider>
    );
}

