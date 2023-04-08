import React from 'react';
import {Alert, Button, Stack, TextField, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import {useForm} from "react-hook-form";

import {Client} from '../client/client';
import {ClientError} from "../client/rest";

const LoginPage = () => {

    const navigate = useNavigate();

    type FormData = {
        email: string,
        password: string
    }

    const {register, handleSubmit, setError, clearErrors, formState: {errors}} = useForm<FormData>();


    const onSubmit = (data: FormData) => {
        Client.User().login(data.email, data.password)
            .then(() => navigate('/welcome')).catch((err: ClientError) => {
                setError('root', {type: 'server', message: err.message});
            })
    }

    const handleRegisterClick = () => {
        navigate('/register')
    }

    return (
        <Login>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Stack direction={'column'} spacing={1} alignItems={'center'}>
                    <Typography paragraph={true} fontSize={26} fontWeight={'bold'}>
                        Login
                    </Typography>
                    {errors.root &&
                        <Alert severity="error" onClose={() => {clearErrors()}} >
                            {errors.root.message}
                        </Alert>
                    }
                    <TextField
                        fullWidth
                        label={'Email'}
                        type={'email'}
                        {...register("email", {required: true})}
                    />
                    <TextField
                        fullWidth
                        label={'Password'}
                        type={'password'}
                        {...register("password", {required: true})}
                    />
                    <Stack direction={'row'} justifyContent={'center'}>
                        <Button type={'submit'}>Log in</Button>
                        <Button onClick={handleRegisterClick}>Register</Button>
                    </Stack>
                </Stack>
            </form>
        </Login>
    )
}

const Login = styled.div`
    justify-content: center;
    display: flex;
    margin-top: 4vh;
`

export default LoginPage;
