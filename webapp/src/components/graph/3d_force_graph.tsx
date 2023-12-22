import React, {useRef, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraph2D, {ForceGraphMethods, LinkObject, NodeObject} from 'react-force-graph-2d';
import {forceCollide} from 'd3';
import {useTheme} from '@mui/material/styles';
import {Alert, Collapse, IconButton} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {useTranslation} from 'react-i18next';

import {Graph, Node, Link, NodeStatusFinished, NodeStatusStarted, NodeStatusWatched, NodeStatusNext, NodeTypeLecture, NodeTypeExample, NodeTypeAssignment, NodeTypeParent, NodeTypeGeneral} from '../../types/graph';
import useAuth from '../../hooks/useAuth';
import {Analytics} from '../../analytics';
import {DagMode} from '../../types/users';
import useGraph from '../../hooks/useGraph';

interface Props {
    graph: Graph;
    width?: number;
    height?: number;
    dimension3: boolean;
    noClick?: boolean;
    dir?: DagMode;
    textColor?: string;
    isLarge?: boolean;
}

const D3ForceGraph = (props: Props) => {
    const navigate = useNavigate();
    const fgRef = useRef<ForceGraphMethods<Node, Link>>();
    const nodeRadius = props.isLarge ? 30 : 20;
    const theme = useTheme();
    const {preferences} = useAuth();
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [highlightLinks, setHighlightLinks] = useState(new Set());
    const [openGreyNodeAlert, setOpenGreyNodeAlert] = useState(false);
    const {t, i18n} = useTranslation();
    const {pathToGoal, goals, selectedNode, setSelectedNode, focusedNodeID, setParentID} = useGraph();

    const onNodeClick = (node : Node) => {
        if (props.noClick){
            return;
        }
        Analytics.clickOnTopic({
            'node_id': node.id,
            'Node Name': node.name,
            'Language': i18n.language,
            'Node Type': node.node_type,
            'Status': node.status,
            'Entry Point': 'Graph'
        });
        if (node.node_type === NodeTypeParent) {
            setParentID(node.id);
            return;
        }
        if (node.status === NodeStatusFinished || node.status === NodeStatusNext || node.status === NodeStatusStarted || node.status === NodeStatusWatched) {
            navigate(`/nodes/${node.id}`);
        } else {
            setOpenGreyNodeAlert(true);
        }
    };

    useEffect(() => {
        if (props.dimension3) {
            return
        }
        fgRef.current!.d3Force('collide', forceCollide(50));
        if (focusedNodeID) {
            let focusNode = null;
            for (let i = 0; i < props.graph.nodes.length; i++) {
                const node = props.graph.nodes[i];
                if (node.id === focusedNodeID) {
                    focusNode = node as NodeObject<Node>
                    break
                }
            }
            if (focusNode) {
                fgRef.current!.centerAt(focusNode.x, focusNode.y, 1000);
                fgRef.current!.zoom(3, 2000);
            }
        }
    },[focusedNodeID]);

    if (props.dimension3) {
        return (
            <ForceGraph3D
                graphData={props.graph}
                nodeLabel="name"
                showNavInfo={false}
                height={props.height}
                dagMode="zout"
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={2}
                // d3VelocityDecay={0.3}
                linkWidth={2}
                onNodeClick={onNodeClick}
                nodeAutoColorBy={"status"}
            />
        );
    }

    const getNodeColor = (node: Node) => {
        if (node.status === NodeStatusFinished) {
            return theme.palette.success.main;
        } else if (node.status === NodeStatusStarted || node.status === NodeStatusWatched){
            return theme.palette.warning.light;
        } else if (node.status === NodeStatusNext) {
            return theme.palette.primary.main;
        } else {
            return theme.palette.grey[500];
        }
    }

    const paintRing = (node: NodeObject<NodeObject<Node>>, ctx: CanvasRenderingContext2D, color: string) => {
        // add ring just for highlighted nodes
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, nodeRadius * 1.4, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
    }

    const updateHighlight = () => {
        setHighlightNodes(highlightNodes);
        setHighlightLinks(highlightLinks);
    };

    const handleNodeHover = (hoveredNode: Node) => {
        highlightNodes.clear();
        highlightLinks.clear();
        if (!hoveredNode) {
            return;
        }

        highlightNodes.add(hoveredNode.id);
        props.graph.links.forEach((link: LinkObject<Node, Link>) => {
            if ((link.source as Node).id === hoveredNode.id) {
                highlightLinks.add(link);
                highlightNodes.add((link.target as Node).id);
            } else if ((link.target as Node).id === hoveredNode.id) {
                highlightLinks.add(link);
                highlightNodes.add((link.source as Node).id);
            }
        });

        updateHighlight();
    };

    function drawStar(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        spikes: number,
        outerRadius: number,
        innerRadius: number,
        color: string
    ) {
        ctx.beginPath();
        ctx.fillStyle = color;
        let rotation = (Math.PI / 2) * 3; // Start from the top
        const step = Math.PI / spikes; // Angle between spikes
        let x = cx;
        let y = cy;

        ctx.moveTo(x, y - outerRadius); // Starting point at the top of the star

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rotation) * outerRadius; // Outer point of spike
            y = cy + Math.sin(rotation) * outerRadius;
            ctx.lineTo(x, y);
            rotation += step;

            x = cx + Math.cos(rotation) * innerRadius; // Inner point between spikes
            y = cy + Math.sin(rotation) * innerRadius;
            ctx.lineTo(x, y);
            rotation += step;
        }

        ctx.lineTo(cx, cy - outerRadius); // Closing the path to the starting point
        ctx.closePath();
        ctx.fill();
    }

    const dagMode = props.dir || preferences?.graph_direction || "lr"

    return (
        <>
            <Collapse in={openGreyNodeAlert}>
                <Alert
                    severity="info"
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setOpenGreyNodeAlert(false);
                            }}
                        >
                            <CloseIcon fontSize="inherit"/>
                        </IconButton>
                    }
                    sx={{mb: 2}}
                >
                    {t("please learn all the prerequisite topics first")}
                </Alert>
            </Collapse>

            <ForceGraph2D
                ref={fgRef}
                enableNodeDrag={false}
                graphData={props.graph}
                nodeLabel="description"
                width={props.width}
                height={props.height}
                linkDirectionalParticleWidth={4}
                linkDirectionalParticles={link => highlightLinks.has(link) ? 2 : 0}
                linkWidth={link => {
                    if (props.isLarge) {
                        return highlightLinks.has(link) ? 8 : 5
                    }
                    return highlightLinks.has(link) ? 5 : 2
                }}
                linkColor={() => props.textColor || ''}
                onNodeClick={onNodeClick}
                dagMode={dagMode}
                nodeVal={20}
                nodeCanvasObject={(currentNode, ctx) => {
                    if (currentNode.node_type === NodeTypeGeneral) {
                        return;
                    }
                    if (currentNode.id === selectedNode?.id) {
                        paintRing(currentNode, ctx, theme.palette.error.main);
                    } else if (highlightNodes.has(currentNode.id)){
                        paintRing(currentNode, ctx, theme.palette.warning.main);
                    } else if (pathToGoal?.has(currentNode.id) && currentNode.status !== NodeStatusFinished){
                        paintRing(currentNode, ctx, theme.palette.info.main);
                    }

                    const label = currentNode.name;
                    const fontSize = 5;
                    ctx.font = `bold ${fontSize}px Sans-Serif`;
                    if (props.isLarge) {
                        ctx.font = 'bold 10px Sans-Serif';
                    }

                    const x = currentNode.x || 0;
                    const y = currentNode.y || 0;
                    const nodeColor = getNodeColor(currentNode);
                    if (goals && goals.find(value => value.node_id === currentNode.id)) {
                        paintRing(currentNode, ctx, theme.palette.info.main);
                        drawStar(ctx, x, y, 4, 3*nodeRadius/2, 2*nodeRadius/3, nodeColor)
                    } else if (currentNode.node_type === NodeTypeLecture || currentNode.node_type === NodeTypeParent) {
                        ctx.beginPath();
                        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI, false);
                        ctx.fillStyle = nodeColor;
                        ctx.fill();
                    } else if (currentNode.node_type === NodeTypeExample) {
                        ctx.fillStyle = nodeColor;
                        ctx.fillRect(x-nodeRadius, y-nodeRadius, 2*nodeRadius, 2*nodeRadius);
                    } else if (currentNode.node_type === NodeTypeAssignment) {
                        drawStar(ctx, x, y, 5, 3*nodeRadius/2, 2*nodeRadius/3, nodeColor)
                    }

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = props.textColor || 'black';
                    ctx.fillText(label, x, y);
                }}
                nodePointerAreaPaint={(node, color, ctx) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x || 0, node.y || 0, nodeRadius, 0, 2 * Math.PI, false);
                    ctx.fill();
                }}
                nodeAutoColorBy={"status"}
                nodeRelSize={1}
                dagLevelDistance={props.isLarge? 60: 100}
                d3VelocityDecay={0.3}
                linkDirectionalArrowLength={props.isLarge? 15 : 6}
                linkDirectionalArrowRelPos={0.5}
                onNodeHover={(node: Node | null) => {
                    if (props.noClick){
                        return;
                    }
                    if (node) {
                        setSelectedNode(node);
                        handleNodeHover(node);
                        setOpenGreyNodeAlert(false);
                    }
                }}
                cooldownTicks={100}
                warmupTicks={200}
                onEngineStop={() => {
                    if (props.isLarge) {
                        fgRef.current!.zoomToFit(1000, 60);
                    } else {
                        fgRef.current!.zoomToFit(1000);
                    }
                }}
            />
        </>
    )
}

export default D3ForceGraph;
