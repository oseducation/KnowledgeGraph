import React, {useEffect} from 'react';
import {Autocomplete, Box, InputBase} from '@mui/material';

const LeonardoPage = () => {
    const [img, setImg] = React.useState('');
    const [text, setText] = React.useState('');
    const [api, setAPI] = React.useState('');

    const [guidance, setGuidance] = React.useState('1');
    const [strength, setStrength] = React.useState('1');
    const [style, setStyle] = React.useState('DYNAMIC');
    const [steps, setSteps] = React.useState('4');
    const [seed, setSeed] = React.useState('');
    const [color, setColor] = React.useState('#aaf0d1')

    useEffect(() => {
        if (img === '') {
            setImg(createBase64Image(color));
        }
        if (text === '' || api === '' || img === '') {
            return;
        }
        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: `Bearer ${api}`
            },
            body: JSON.stringify({
                width: 512,
                height: 512,
                imageDataUrl: img,
                strength: 1,
                prompt: text,
                seed: seed ? convert(seed) : undefined,
                guidance: convert(guidance),
                steps: convert(steps),
                style,
                requestTimestamp: Date.now(),
            })
        };
        fetch('https://cloud.leonardo.ai/api/rest/v1/generations-lcm', options)
        // fetch('https://cloud.leonardo.ai/api/rest/v1/lcm-instant-refine', options)
            .then(response => response.json())
            .then(response => {
                console.log(response);
                if (response && response.lcmGenerationJob && response.lcmGenerationJob.imageDataUrl && response.lcmGenerationJob.imageDataUrl.length && response.lcmGenerationJob.imageDataUrl.length > 0){
                    setImg(response.lcmGenerationJob.imageDataUrl[0]);
                }
            })
            .catch(err => console.error(err));
    }, [text]);

    return (
        <Box display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
            <img src={img} alt="Leonardo"/>
            <InputBase
                placeholder="Prompt"
                autoComplete='off'
                value={text}
                onChange={(e) => setText(e.target.value)}
                sx={{width: '400px', borderRadius: '12px'}}
            />
            <InputBase
                placeholder="Initial color"
                autoComplete='off'
                value={color}
                onChange={(e) => {
                    setColor(e.target.value);
                    setImg(createBase64Image(e.target.value));
                }}
                sx={{width: '400px', borderRadius: '12px'}}
            />
            <Autocomplete
                options={["ANIME", "CINEMATIC", "DIGITAL_ART", "DYNAMIC", "ENVIRONMENT", "FANTASY_ART", "ILLUSTRATION", "PHOTOGRAPHY", "RENDER_3D", "RAYTRACED", "SKETCH_BW", "SKETCH_COLOR", "VIBRANT", "NONE"]}
                disablePortal
                color={'text.secondary'}

                renderInput={(params) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const {InputLabelProps, InputProps, ...rest} = params;
                    return (
                        <InputBase
                            {...params.InputProps} {...rest}
                            placeholder="style"
                            autoComplete='off'
                            sx={{
                                border:'none',
                                flex: 1,
                                pl: 2,
                                borderRadius: '12px',
                                width: '400px',
                            }}
                        />
                    )}
                }
                onInputChange={(_, newInputValue) => {
                    setStyle(newInputValue);
                }}
            />
            <InputBase
                placeholder="Guidence - Must be a float between 0.5 and 20"
                autoComplete='off'
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                sx={{width: '400px', borderRadius: '12px'}}
            />
            <InputBase
                placeholder="Strength - Must be a float between 0.1 and 1"
                autoComplete='off'
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                sx={{width: '400px', borderRadius: '12px'}}
            />
            <InputBase
                placeholder="Steps - Must be between 4 and 16"
                autoComplete='off'
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                sx={{width: '400px', borderRadius: '12px'}}
            />
            <InputBase
                placeholder="Seed"
                autoComplete='off'
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                sx={{width: '400px', borderRadius: '12px'}}
            />
            <InputBase
                placeholder="API Token"
                autoComplete='off'
                value={api}
                onChange={(e) => setAPI(e.target.value)}
                sx={{width: '400px', borderRadius: '12px'}}
            />
        </Box>
    );
}

export default LeonardoPage;

function convert(a: string): number {

    // Type conversion
    // of string to float
    const floatValue = +a;

    // Return float value
    return floatValue;
}


function createBase64Image(color: string): string {
    console.log(color);
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    // Get the 2D context of the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    // Fill the canvas with the specified color
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert the canvas to a base64 string
    const res = canvas.toDataURL('image/jpeg', 1.0);

    // return "data:image/jpeg;base64,"+canvas.toDataURL('image/jpeg', 1.0).split(",")[1];
    return res;
}


