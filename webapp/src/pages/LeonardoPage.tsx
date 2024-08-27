import React, {useEffect} from 'react';
import {Autocomplete, Box, InputBase} from '@mui/material';

const LeonardoPage = () => {
    const [img, setImg] = React.useState('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAsICAoIBwsKCQoNDAsNERwSEQ8PESIZGhQcKSQrKigkJyctMkA3LTA9MCcnOEw5PUNFSElIKzZPVU5GVEBHSEX/2wBDAQwNDREPESESEiFFLicuRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUX/wAARCAIAAgADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/2Q==');
    const [text, setText] = React.useState('');
    const [api, setAPI] = React.useState('');

    const [guidance, setGuidance] = React.useState('1');
    const [strength, setStrength] = React.useState('1');
    const [style, setStyle] = React.useState('DYNAMIC');
    const [steps, setSteps] = React.useState('4');
    const [seed, setSeed] = React.useState('');

    useEffect(() => {
        if (text === '' || api === '') {
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
            <Autocomplete
                options={["ANIME", "CINEMATIC", "DIGITAL_ART", "DYNAMIC", "ENVIRONMENT", "FANTASY_ART", "ILLUTRATION", "PHOTOGRAPHY", "RENDER_3D", "RAYTRACED", "SKETCH_BW", "SKETCH_COLOR", "VIBRANT", "NONE"]}
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
