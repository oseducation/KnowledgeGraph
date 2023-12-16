import React, {useEffect, useState} from 'react';
import {
    Avatar,
    AvatarGroup,
    Box,
    BoxProps,
    Button,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Stack,
    styled,
    Typography,
    useTheme
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import {useNavigate} from "react-router-dom";
import {useTranslation} from 'react-i18next';

import {getVideoLength, NodeStatusFinished, NodeStatusNext, NodeStatusStarted, NodeStatusWatched, NodeWithResources} from '../../types/graph';
import {Client} from '../../client/client';
import {User} from '../../types/users';
import IKnowThisButton from "../I_konw_this_button";
import useGraph from '../../hooks/useGraph';

const stringToColor = (st: string) => {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < st.length; i += 1) {
        hash = st.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

export const stringAvatar = (user: User) => {
    const name = user.first_name + ' ' + user.last_name
    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        children: `${user.first_name[0]}${user.last_name[0]}`,
    };
}

type RHSProps = {
    userID: string;
    onReload: () => void;
}

const RHS = (props: RHSProps) => {
    const {selectedNode, addGoal, removeGoal, goals} = useGraph();
    const theme = useTheme()
    const {t} = useTranslation();

    const [nodeWithResources, setNodeWithResources] = useState<NodeWithResources>({} as NodeWithResources);
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (selectedNode && selectedNode.id) {
            Client.Node().get(selectedNode.id).then((data) => {
                setNodeWithResources(data);
            });
        }
    }, [selectedNode?.id]);


    function markAsKnown() {
        if (props.userID && selectedNode?.id) {
            setLoading(true)
            Client.Node().markAsKnown(selectedNode.id, props.userID)
                .then(() => {
                    props.onReload();
                    setLoading(false)
                })
                .catch(() => {
                    setLoading(false)
                });
            // props.onReload();
        }
    }

    function markAsStarted() {
        if (props.userID && selectedNode?.id) {
            setLoading(true)
            Client.Node().markAsStarted(selectedNode.id, props.userID)
                .then(() => {
                    props.onReload();
                    setLoading(false)
                })
                .catch(() => {
                    setLoading(false)
                });
            // props.onReload();
        }
    }

    const isActiveNodeStatus = (status: string) => {
        return status === NodeStatusFinished || status === NodeStatusNext || status === NodeStatusStarted || status === NodeStatusWatched
    }

    const navigateToResources = () => {
        if (isActiveNodeStatus(selectedNode?.status || '')) {
            navigate(`/nodes/${nodeWithResources.id}`);
        }
    }

    let buttonComp = null;
    if (isActiveNodeStatus(selectedNode?.status || '')) {
        buttonComp =
            <IKnowThisButton
                isNodeFinished={selectedNode?.status === NodeStatusFinished}
                loading={loading}
                onMarkAsKnown={markAsKnown}
                onMarkAsStarted={markAsStarted}
            />
    } else if (goals && goals.find(value => value.node_id === selectedNode?.id)) {
        buttonComp =
            <Button
                variant='contained'
                color='primary'
                onClick={() => {
                    if (selectedNode?.id) {
                        Client.Graph().deleteGoal(selectedNode?.id || '').then(() => {
                            removeGoal(selectedNode.id);
                        })
                    }
                }}
            >
                {t("Remove Goal")}
            </Button>
    } else {
        buttonComp =
            <Button
                variant='contained'
                color='primary'
                onClick={() => {
                    if (selectedNode?.id) {
                        Client.Graph().addGoal(selectedNode?.id || '').then(() => {
                            addGoal({
                                node_id: selectedNode.id,
                                name: selectedNode.name,
                                thumbnail_relative_url: `/images/nodes/${selectedNode.name.replaceAll(' ', '-')}.png`,
                            });
                        })
                    }
                }}
            >
                {t("Add a new Goal")}
            </Button>
    }


    return (
        <StyledBox height='100%'>
            <Stack bgcolor={theme.palette.grey[100]} height={'100%'}>
                <Stack
                    direction='row'
                    bgcolor={theme.palette.grey[300]}
                    height='fit-content'
                    minHeight='48px'
                    alignItems='center'
                    sx={{border: (theme) => `1px solid ${theme.palette.divider}`}}
                >
                    <Typography
                        fontSize={20}
                        fontWeight={600}
                        sx={{p: '10px'}}
                    >
                        {t("Topic Details")}
                    </Typography>
                    <Divider
                        orientation='vertical'
                        variant='middle'
                        flexItem
                        sx={{p: '4px 0px'}}
                    />
                    <Typography
                        fontSize={20}
                        fontWeight={500}
                        sx={{p: '10px'}}
                    >
                        {selectedNode?.name}
                    </Typography>
                </Stack>

                <Box sx={{p: '10px'}}>{selectedNode?.description}</Box>
                {nodeWithResources.active_users && nodeWithResources.active_users.length > 0 &&
                    <Stack direction='row' alignItems='center'>
                        <Typography
                            sx={{p: '10px'}}
                            fontSize={18}
                            fontWeight={500}
                        >
                            {t("Active Learners")}
                        </Typography>
                        <AvatarGroup max={5}>
                            {nodeWithResources.active_users.map(user =>
                                <Avatar key={user.id} alt={user.username} {...stringAvatar(user)}/>
                            )}
                        </AvatarGroup>
                    </Stack>
                }
                {((nodeWithResources.videos && nodeWithResources.videos.length > 0) || (nodeWithResources.texts && nodeWithResources.texts.length > 0)) &&
                    <>
                        <Divider/>
                        <List
                            sx={{width: '100%', maxWidth: 400, height: '100%', bgcolor: 'background.paper'}}
                            component="nav"
                            aria-labelledby="resources"
                            subheader={
                                <ListSubheader component="div" id="resources">
                                    <Typography
                                        fontSize={18}
                                        fontWeight={600}
                                    >
                                        {t("Resources")}
                                    </Typography>
                                </ListSubheader>
                            }
                        >
                            {nodeWithResources.videos && nodeWithResources.videos.map(video =>
                                <ListItemButton
                                    key={video.id}
                                    onClick={navigateToResources}
                                >
                                    <ListItemIcon>
                                        <YouTubeIcon/>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={video.name}
                                        secondary={"(" + getVideoLength(video.length) + " min)"}/>
                                </ListItemButton>
                            )}
                            {nodeWithResources.videos && nodeWithResources.videos.length > 0 && <Divider/>}
                            {nodeWithResources.texts && nodeWithResources.texts.map(text =>
                                <ListItemButton
                                    key={text.name}
                                    onClick={navigateToResources}
                                >
                                    <ListItemIcon>
                                        <TextSnippetIcon/>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={text.name}
                                    />
                                </ListItemButton>
                            )}
                        </List>
                    </>
                }
                <Box bgcolor='background.paper' display='flex' justifyContent='center' paddingY={1}>
                    {selectedNode?.parent_id !== '' && buttonComp}
                </Box>
            </Stack>
        </StyledBox>
    )
}

const StyledBox = styled(Box)<BoxProps>(({theme}) => ({
    boxShadow: theme.shadows[3],
}));

export default RHS;
