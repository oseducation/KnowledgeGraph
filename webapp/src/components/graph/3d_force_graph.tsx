import React, {useRef, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraph2D, {ForceGraphMethods, LinkObject, NodeObject} from 'react-force-graph-2d';
import {forceCollide} from 'd3';
import {useTheme} from '@mui/material/styles';

import {Graph, Node, Link, NodeStatusFinished, NodeStatusStarted, NodeStatusWatched, NodeStatusNext} from '../../types/graph';
import useAuth from '../../hooks/useAuth';

import {GraphNodeHoverContext} from './../main';

interface Props {
    graph: Graph;
    width?: number;
    height?: number;
    dimension3: boolean;
    focusNodeID?: string;
}

const D3ForceGraph = (props: Props) => {
    const navigate = useNavigate();
    const fgRef = useRef<ForceGraphMethods<Node, Link>>();
    const {node, setNode} = React.useContext(GraphNodeHoverContext);
    const nodeRadius = 20;
    const theme = useTheme();
    const {preferences} = useAuth();
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [highlightLinks, setHighlightLinks] = useState(new Set());

    const onNodeClick = ({id} : Node) => {
        navigate(`/nodes/${id}`)
    };

    useEffect(() => {
        if (props.dimension3) {
            return
        }
        fgRef.current!.d3Force('collide', forceCollide(50));
        if (props.focusNodeID) {
            let focusNode = null;
            for (let i = 0; i < props.graph.nodes.length; i++) {
                const node = props.graph.nodes[i];
                if (node.id === props.focusNodeID) {
                    focusNode = node as NodeObject<Node>
                    break
                }
            }
            if (focusNode) {
                fgRef.current!.centerAt(focusNode.x, focusNode.y, 1000);
                fgRef.current!.zoom(3, 2000);
            }
        }
    },[props.focusNodeID]);

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
            return theme.palette.secondary.main;
        } else if (node.status === NodeStatusNext) {
            return theme.palette.primary.main;
        } else {
            return theme.palette.grey[400];
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

    return (
        <ForceGraph2D
            ref={fgRef}
            graphData={props.graph}
            nodeLabel="description"
            width={props.width}
            height={props.height}
            linkDirectionalParticleWidth={4}
            linkDirectionalParticles={link => highlightLinks.has(link) ? 2 : 0}
            linkWidth={link => highlightLinks.has(link) ? 5 : 2}
            onNodeClick={onNodeClick}
            dagMode={preferences?.graph_direction || "lr"}
            nodeVal={20}
            nodeCanvasObject={(currentNode, ctx) => {
                if (currentNode.id === node?.id) {
                    paintRing(currentNode, ctx, 'red');
                } else if (highlightNodes.has(currentNode.id)){
                    paintRing(currentNode, ctx, 'orange');
                }

                const label = currentNode.name;
                const fontSize = 5;
                ctx.font = `${fontSize}px Sans-Serif`;

                ctx.beginPath();
                ctx.arc(currentNode.x || 0, currentNode.y || 0, nodeRadius, 0, 2 * Math.PI, false);
                ctx.fillStyle = getNodeColor(currentNode);
                ctx.fill();

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'black';
                ctx.fillText(label, currentNode.x||0, currentNode.y||0);
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x || 0, node.y || 0, nodeRadius, 0, 2 * Math.PI, false);
                ctx.fill();
            }}
            nodeAutoColorBy={"status"}
            nodeRelSize={1}
            dagLevelDistance={50}
            d3VelocityDecay={0.3}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={0.5}
            onNodeHover={(node: Node | null) => {
                if (node) {
                    setNode(node);
                    handleNodeHover(node);
                }
            }}
            cooldownTicks={100}
            warmupTicks={200}
            onEngineStop={() => fgRef.current!.zoomToFit(1000)}
        />
    )
}

export default D3ForceGraph;
