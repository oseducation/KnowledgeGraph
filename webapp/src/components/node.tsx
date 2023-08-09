import React, {useEffect, useState} from 'react';
import {Box, Divider, Drawer, Typography, useTheme} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import Grid2 from '@mui/material/Unstable_Grid2';
import ReactMarkdown from 'react-markdown'
import {useTranslation} from 'react-i18next';

import {getVideoLength, NodeStatusFinished, NodeWithResources, Video, Text} from '../types/graph';
import {Client} from '../client/client';
import {GroupItem, SidebarGroup} from '../types/sidebar';
import useAuth from '../hooks/useAuth';
import useDrawer from '../hooks/useDrawer';

import LHSNavigation from './lhs/lhs_navigation';
import VideoPlayer from './player';
import VideoInput from './video_input';
import NodeTitleSection from "./node_title_section";

interface Props {
    nodeID: string;
}

const Node = (props: Props) => {
    const [node, setNode] = useState<NodeWithResources>({} as NodeWithResources);
    const [activeItem, setActiveItem] = useState<Video | Text | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const theme = useTheme();
    const {user} = useAuth()
    const {open, setOpen} = useDrawer();
    const {t} = useTranslation();
    const {
        mixins: {toolbar},
    } = useTheme();

    function loadNode() {
        Client.Node().get(props.nodeID).then((data) => {
            setNode(data);
            setLoading(false)
        }).catch(() => {
            setLoading(false)
        });
    }

    useEffect(() => {
        if (!activeItem) {
            loadNode();
        }
    }, [props.nodeID]);

    const handleDrawerToggle = () => {
        setOpen?.(!open);
    };

    const computeGroups = (node: NodeWithResources) => {
        const videoItems = node.videos ? node.videos.map(video => {
            return {
                areaLabel: video.name,
                display_name: video.name + " (" + getVideoLength(video.length) + " min)",
                secondary: "by " + video.author_username,
                id: video.id,
                link: node.id,
                icon: <YouTubeIcon/>,
                onClick: () => {
                    setActiveItem(video);
                }
            } as GroupItem;
        }) : [];

        const videosGroup = {
            collapsed: false,
            display_name: t("Videos"),
            id: "videos",
            items: videoItems
        } as SidebarGroup;

        const textItems = node.texts ? node.texts.map(text => {
            return {
                areaLabel: text.name,
                display_name: text.name,
                secondary: "by " + text.author_username,
                id: text.id,
                link: node.id,
                icon: <TextSnippetIcon/>,
                onClick: () => {
                    setActiveItem(text);
                }
            } as GroupItem;
        }) : [];

        const textsGroup = {
            collapsed: false,
            display_name: t("Texts"),
            id: "texts",
            items: textItems,
        } as SidebarGroup;

        const testsGroup = {
            collapsed: false,
            display_name: t("Tests"),
            id: "tests",
            items: []
        } as SidebarGroup;

        return [videosGroup, textsGroup, testsGroup];
    }

    const groups = computeGroups(node)

    const header = (
        <Typography
            fontSize={20}
            fontWeight={600}
            color={theme.palette.primary.contrastText}
            onClick={() => setActiveItem(null)}
            sx={{
                p: '10px 2px',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                },
                '&:active': {
                    backgroundColor: theme.palette.action.active,
                },
            }}
        >
            {node.name}
        </Typography>
    );

    const onVideoStarted = (videoKey: string) => {
        if (user && user.id) {
            Client.Node().markAsStarted(node.id, user.id);
            Client.Video().videoStarted(videoKey);
        }
    }

    const onVideoEnded = (videoKey: string) => {
        if (user && user.id) {
            Client.Node().markAsWatched(node.id, user.id);
            Client.Video().videoFinished(videoKey);
        }
    }

    const markAsKnown = () => {
        if (user && user.id) {
            setLoading(true)
            Client.Node().markAsKnown(node.id, user.id)
                .then(() => {
                    loadNode();
                })
                .catch(() => {
                    setLoading(false)
                })
        }
    }

    const markAsStarted = () => {
        if (user && user.id) {
            setLoading(true)
            Client.Node().markAsStarted(node.id, user.id)
                .then(() => {
                    loadNode();
                })
                .catch(() => {
                    setLoading(false)
                })
        }
    }

    // https://github.com/mui/material-ui/issues/10739#issuecomment-1365008174
    const staticHeight = `calc(100vh - (${toolbar?.minHeight}px + ${8}px))`;

    return (
        <>
            {user && <Box
                component="nav"
                sx={{
                    width: {sm: 240},
                    flexShrink: {sm: 0}
                }}
                aria-label="drawer"
            >
                <Drawer
                    variant="temporary"
                    open={open}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        height: staticHeight,
                        overflowY: 'auto',
                        display: {xs: 'block', sm: 'block', md:'none'},
                        '& .MuiDrawer-paper': {boxSizing: 'border-box', width: 240},
                    }}
                >
                    <LHSNavigation groups={groups}/>
                </Drawer>
            </Box>}
            <Grid2 container disableEqualOverflow>
                <Grid2 xs={3} sx={{
                    height: staticHeight,
                    overflowY: 'auto',
                    maxWidth: '240px',
                    display: {xs: 'none', sm: 'none', md: 'block', lg: 'block'}
                }}>
                    <LHSNavigation groups={groups} header={header}/>
                </Grid2>
                <Grid2 xs={true} sx={{
                    height: staticHeight,
                    overflowY: 'auto',
                }}>
                    {activeItem && determineIfIsVideo(activeItem) &&
                        <VideoPlayer
                            videoKey={activeItem.key}
                            width={'100%'}
                            height={'100%'}
                            autoplay={true}
                            onVideoStarted={onVideoStarted}
                            onVideoEnded={onVideoEnded}
                        />
                    }
                    {activeItem && determineIfIsText(activeItem) &&
                        <ReactMarkdown>
                            {activeItem.text}
                        </ReactMarkdown>
                    }
                    {!activeItem &&
                        <Box
                            display={"flex"}
                            flexDirection={"column"}
                            sx={{
                                width: '100%',
                                alignItems: 'center',
                            }}
                        >
                            <NodeTitleSection
                                nodeTitle={node.name}
                                nodeDescription={node.description}
                                nodeFinished={node.status === NodeStatusFinished}
                                loading={loading}
                                onMarkAsKnown={markAsKnown}
                                onMarkAsStarted={markAsStarted}
                            />
                            <Grid2 xs={10}>
                                {node.videos && node.videos.map((video) => (
                                    <Box
                                        key={video.key}
                                        sx={{
                                            mb: 8,
                                            height: {sm: 300, md: 500, lg: 700}
                                        }}
                                    >
                                        <VideoPlayer
                                            videoKey={video.key}
                                            key={video.key}
                                            width={'100%'}
                                            height={'100%'}
                                            autoplay={false}
                                            onVideoStarted={onVideoStarted}
                                            onVideoEnded={onVideoEnded}
                                        />
                                        <Divider variant={"fullWidth"}/>
                                    </Box>
                                ))}
                            </Grid2>
                            <VideoInput nodeID={props.nodeID}/>
                        </Box>
                    }
                </Grid2>
                <Grid2
                    xs={3}
                    sx={{
                        height: staticHeight,
                        overflowY: 'auto',
                        maxWidth: '400px',
                        display: {xs: 'none', sm: 'none', md: 'none', lg: 'block'}
                    }}
                    textAlign={'center'}
                    bgcolor={'gray'}
                >
                    {t("Chat coming soon")}
                </Grid2>
            </Grid2>
        </>
    )
}

const determineIfIsVideo = (toBeDetermined: Video | Text): toBeDetermined is Video => {
    if((toBeDetermined as Video).key){
        return true
    }
    return false
}

const determineIfIsText = (toBeDetermined: Video | Text): toBeDetermined is Text => {
    if((toBeDetermined as Text).text){
        return true
    }
    return false
}

export default Node;
