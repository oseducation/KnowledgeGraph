import React from 'react';
import {useParams} from 'react-router-dom';
import {Stack} from '@mui/material';

import Header from '../components/header';
import Node from '../components/node';

const HomePage = () => {
    const {nodeID} = useParams<{nodeID: string}>();
    if (!nodeID) {
        return null;
    }

    return (
        <Stack>
            <Header/>
            <Node nodeID={nodeID}/>
        </Stack>
    )
}

export default HomePage;
