import React from 'react';

import {Client} from '../../client/client';

import OnePagerWithPicture from './one_pager_with_pic';

const Calculus = () => {
    return (
        <OnePagerWithPicture
            name='Learn Calculus With AI Tutor'
            description='Master Calculus faster and smarter by learning 5-minute topics daily with our AI tutor'
            imageURL='/experiments/calculus.jpg'
            onSignUp={(email: string) => {Client.Experiments().addCalculus(email);}}
        />
    );
}

export default Calculus;
