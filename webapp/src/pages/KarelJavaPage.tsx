import React from 'react';
import {useParams} from 'react-router-dom';

import IDE from '../components/karel/ide';

const KarelJavaPage = () => {
    const {nodeName} = useParams<{ nodeName: string }>();
    if (!nodeName) {
        return <div>no IDE</div>
    }
    return <IDE nodeName={nodeName} lang={'java'}/>

}

export default KarelJavaPage;
