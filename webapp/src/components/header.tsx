import * as React from 'react';
import {useNavigate, useLocation} from "react-router-dom";
import {AppBar, Box, Toolbar, Typography, Container, Button, Stack, styled, useMediaQuery, IconButton} from "@mui/material";
import {useTheme} from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import {useTranslation} from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import useAuth from "../hooks/useAuth";
import useDrawer from '../hooks/useDrawer';
import {Analytics} from '../analytics';

import ProfileDropdown from "./profile_dropdown";
import LanguagePicker from './language_picker';


function Header() {
    const navigate = useNavigate();
    const {user} = useAuth()
    const theme = useTheme();
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
    const {open, setOpen} = useDrawer();
    const isLoggedInOnThePhone = user && isPhone;
    const location = useLocation();
    const {t} = useTranslation();

    let hasIconButton = true;
    if (location.pathname === '/carousel' || !user) {
        hasIconButton = false
    }

    let hasBackButton = false;
    if (location.pathname.startsWith('/nodes/')) {
        hasBackButton = true;
    }

    function getTitle() {
        return <Typography
            variant="h6"
            noWrap
            sx={{
                minWidth: "max-content",
                mr: 2,
                display: {xs: 'none', sm: 'block'},
                fontWeight: 700,
                letterSpacing: '.3rem',
            }}
            align={"center"}>
            VITSI.AI
        </Typography>;
    }

    const handleBoxClick = () => {
        navigate('/')
    }

    function logoAndTitle() {
        return <Stack
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            spacing={2}
            onClick={handleBoxClick}
            sx={{cursor: 'pointer'}}
        >
            {hasBackButton? <ArrowBackIcon/> : getLogo()}
            {!isLoggedInOnThePhone && getTitle()}
        </Stack>;
    }

    function getLoginButton() {
        return <Button
            color='inherit'
            variant='outlined'
            onClick={() => navigate('/login')}
            id="login-button"
            sx={{
                minWidth: {xs: 'min-content', sm: 'max-content'},
                whiteSpace: 'nowrap',
                m: '4px'
            }}
        >
            {t("Sign in")}
        </Button>
    }

    const handleDrawerToggle = () => {
        setOpen?.(!open);
    };

    return (
        <AppBar position="static">
            <Container maxWidth={false}>
                <Toolbar disableGutters>
                    {hasIconButton && <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{
                            mr: 2,
                            display: {xs: 'block', sm: 'block', md: 'none'},
                        }}
                    >
                        <MenuIcon/>
                    </IconButton>}
                    {logoAndTitle()}
                    <Spacer/>
                    {user == null ?
                        <>
                            {getLoginButton()}
                            <Button
                                variant='outlined'
                                color='inherit'
                                onClick={() => {
                                    Analytics.signUpStarted("header");
                                    navigate('/register');
                                }}
                                sx={{
                                    m: {xs: 1, sm: 1, md: 2},
                                    minWidth: {xs: 'min-content', sm: 'max-content'},
                                    whiteSpace: 'nowrap'
                                }}>

                                {isPhone? t("Sign Up") : t("Sign Up For Free")}
                            </Button>
                            <LanguagePicker/>
                        </>
                        :
                        <>
                            {isLoggedInOnThePhone?
                                <ViewCarouselIcon
                                    style={{margin: '10px'}}
                                    onClick={() => navigate('/carousel')}
                                />
                                :
                                <Button
                                    variant='text'
                                    style={{margin: '10px'}}
                                    onClick={() => navigate('/carousel')}
                                    sx={{
                                        minWidth: {xs: 'min-content', sm: 'max-content'},
                                        color: 'white',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {t("Carousel Mode")}
                                </Button>
                            }
                            <ProfileDropdown/>
                        </>
                    }
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export const Spacer = styled('div')(() => ({
    position: 'relative',
    width: '100%'
}));

export const getLogo = () => {
    return <Box
        component="img"
        sx={{
            height: 52,
        }}
        alt="Vitsi AI"
        src="/logo.png"
        mr="4px"
    />;
}

export default Header;
