
import React, {createContext, useEffect, useState} from 'react';

import {Client} from "../client/client";
import {Graph, Link, Node, NodeStatusFinished, NodeStatusNext, NodeStatusStarted, NodeStatusWatched, NodeTypeLecture, NodeTypeExample, NodeTypeAssignment, castToLink, Goal, cloneGraph} from '../types/graph';
import useAuth from '../hooks/useAuth';

interface GraphContextState {
    globalGraph: Graph | null;
    graph: Graph | null;
    setParentID: React.Dispatch<React.SetStateAction<string>>
    pathToGoal: Map<string, string> | null;
    goals: Goal[];
    onReload: () => void;
    addGoal: (goal: Goal) => void;
    removeGoal: (goal: string) => void;
    selectedNode: Node | null;
    setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>;
    focusedNodeID: string;
    setFocusedNodeID: React.Dispatch<React.SetStateAction<string>>;
}

const GraphContext = createContext<GraphContextState>({
    globalGraph: null,
    graph: null,
    setParentID: () => {},
    pathToGoal: null,
    goals: [],
    onReload: () => {},
    addGoal: () => {},
    removeGoal: () => {},
    selectedNode: null,
    setSelectedNode: () => {},
    focusedNodeID: '',
    setFocusedNodeID: () => {},
});

interface Props {
    children: React.ReactNode
}

export const GraphProvider = (props: Props) => {
    const [globalGraph, setGlobalGraph] = useState<Graph | null>(null);
    const [graph, setGraph] = useState<Graph | null>(null);
    const [parentID, setParentID] = useState<string>("");
    const [pathToGoal, setPathToGoal] = useState<Map<string, string> | null>(null);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [reload, setReload] = useState<boolean>(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [focusedNodeID, setFocusedNodeID] = useState<string>('');
    const {preferences} = useAuth();

    const onReload = () => {
        setPathToGoal(null);
        setGraph(null);
        setGlobalGraph(null);
        setParentID("");
        setReload(prev => !prev);
    }

    const addGoal = (newGoal: Goal) => {
        if (!globalGraph) {
            return;
        }
        if (goals && goals.find(value => value.node_id === newGoal.node_id)) {
            return;
        }
        const newPathToGoal = computePathToGoal(globalGraph, newGoal.node_id);
        setPathToGoal(newPathToGoal);
        setGoals([newGoal, ...goals]);
    }

    const removeGoal = (goal: string) => {
        if (!globalGraph) {
            return;
        }
        const newGoals = goals.filter(value => value.node_id !== goal)
        let newPathToGoal = new Map<string, string>();
        if (newGoals.length > 0) {
            newPathToGoal = computePathToGoal(globalGraph, newGoals[0].node_id);
        }
        setPathToGoal(newPathToGoal);
        setGoals(newGoals);
    }

    const fetchGraphData = async () => {
        Client.Graph().get().then((data: Graph | null) => {
            if (!data) {
                return;
            }
            computeNextNodes(data)
            setGlobalGraph(data);
            const graph = getGraphForParent(data, "");
            setGraph(graph);

            Client.Graph().getGoals().then((goals: Goal[]) => {
                if (goals && goals.length > 0) {
                    const computedPathToGoal = computePathToGoal(data, goals[0].node_id);
                    setPathToGoal(computedPathToGoal);
                    setGoals(goals);
                }
            });
        });
    }

    useEffect(() => {
        if (!globalGraph || !pathToGoal) {
            fetchGraphData();
        }
    }, [reload, preferences?.language])

    useEffect(() => {
        if (!globalGraph) {
            return;
        }
        const graph = getGraphForParent(globalGraph, parentID);
        setGraph(graph);
    }, [parentID])

    return (
        <GraphContext.Provider value={{globalGraph, graph, setParentID, pathToGoal, onReload, goals, addGoal, removeGoal, selectedNode, setSelectedNode, focusedNodeID, setFocusedNodeID}}>
            {props.children}
        </GraphContext.Provider>
    );
}

export default GraphContext;


const getGraphForParent = (graph: Graph, parentID: string) => {
    const nodes = graph.nodes.filter(node => node.parent_id === parentID);
    const links = [];
    for (const link of graph.links) {
        if (nodes.find(node => node.id === link.source) && nodes.find(node => node.id === link.target)) {
            links.push(link);
        }
    }
    return cloneGraph({nodes, links});
}

function topologicalSort(neighbors: Map<string, string[]>, start: string): string[] {
    const stack: string[] = [];
    const visited: { [key: string]: boolean } = {};

    function visit(node: string) {
        if (!visited[node]) {
            visited[node] = true;
            for (const neighbor of neighbors.get(node) || []) {
                visit(neighbor);
            }
            stack.push(node);
        }
    }

    visit(start);
    return stack.reverse();
}

const allPreviousNodes = (reverseNeighbors: Map<string, string[]>, goalNodeID: string) => {
    const visited: { [key: string]: boolean } = {};
    const queue: string[] = [goalNodeID];
    const nodes: Map<string, boolean> = new Map();

    while (queue.length > 0) {
        const currentNode = queue.shift()!;
        if (!visited[currentNode]) {
            visited[currentNode] = true;
            nodes.set(currentNode, true);

            const neighbors = reverseNeighbors.get(currentNode) || [];
            for (const neighbor of neighbors) {
                if (!visited[neighbor]) {
                    queue.push(neighbor);
                }
            }
        }
    }

    return nodes;
}

export const computePathToGoal = (graph: Graph, goalNodeID: string) => {
    const neighbors = generateGraph(graph.nodes, graph.links)
    const reverseNeighbors = generateReverseGraph(graph.nodes, graph.links)

    let start = ''
    for (const node of graph.nodes) {
        if (reverseNeighbors.get(node.id)?.length === 0 && node.parent_id !== "") {
            start = node.id;
            break;
        }
    }

    const topologicallySortedNodes = topologicalSort(neighbors, start)
    const prevNodes = allPreviousNodes(reverseNeighbors, goalNodeID)

    const pathToGoalList = [];
    for (const node of topologicallySortedNodes) {
        if (prevNodes.has(node)){
            pathToGoalList.push(node);
        }
    }

    const pathToGoal = new Map<string, string>();

    for (let i = 0; i < pathToGoalList.length - 1; i++){
        pathToGoal.set(pathToGoalList[i], pathToGoalList[i+1])
    }

    return pathToGoal;
}

export const computeNextNodeInProgress = (graph: Graph, pathToGoal: Map<string, string>) => {
    const [inProgressNodes, ] = computeNextNodes(graph);
    if (!inProgressNodes || inProgressNodes.length === 0) {
        return null;
    }

    for (const node of inProgressNodes) {
        if (pathToGoal.has(node.id)) {
            return node;
        }
    }
}

export const computeNextNodeNew = (graph: Graph, pathToGoal: Map<string, string>) => {
    const [, nextNodes] = computeNextNodes(graph);
    if (!nextNodes || nextNodes.length === 0) {
        return null;
    }

    for (const node of nextNodes) {
        if (pathToGoal.has(node.id)) {
            return node;
        }
    }
}

export const nextNodeToGoal = (graph: Graph | null, pathToGoal: Map<string, string> | null, goalNodeID: string) => {
    if (graph === null || pathToGoal === null) {
        return null;
    }
    const [inProgressNodes, nextNodes] = computeNextNodes(graph);
    if (goalNodeID === "") {
        if (inProgressNodes && inProgressNodes.length !== 0) {
            return inProgressNodes[0].id;
        } else if (nextNodes && nextNodes.length !== 0) {
            return nextNodes[0].id;
        }
        return null;
    }

    if (inProgressNodes && inProgressNodes.length !== 0) {
        for (const node of inProgressNodes) {
            if (pathToGoal.has(node.id)) {
                return node.id;
            } else if (node.id === goalNodeID) {
                return node.id;
            }
        }
    }
    if (nextNodes && nextNodes.length !== 0) {
        for (const node of nextNodes) {
            if (pathToGoal.has(node.id)) {
                return node.id;
            } else if (node.id === goalNodeID) {
                return node.id;
            }
        }
    }

    return null;
}

const computeParentMap = (graph: Graph) => {
    const parentMap = new Map<string, Node[]>();
    for (const node of graph.nodes) {
        if (!parentMap.has(node.id)) {
            parentMap.set(node.id, []);
        }
        if (!parentMap.has(node.parent_id)) {
            parentMap.set(node.parent_id, []);
        }
        parentMap.get(node.parent_id)!.push(node);
    }
    return parentMap;
}

export const computeNextNodes = (graph: Graph) => {
    const nodesMap = new Map<string, Node>();
    graph.nodes.forEach((node) => {
        if (node.parent_id !== "") {
            nodesMap.set(node.id, node)
        }
    })

    const prereqMap = new Map<string, Node>();
    for (let i = 0; i < graph.links.length; i++) {
        const link = castToLink(graph.links[i]);
        const tar = nodesMap.get(link.target);
        if (tar === undefined || tar.status === NodeStatusFinished) {
            continue
        }
        const sou = nodesMap.get(link.source);
        if (sou === undefined || sou.status === NodeStatusFinished) {
            continue
        }
        prereqMap.set(tar.id, tar);
    }

    const inProgressNodes = [];
    const nextNodes = [];
    for (const node of graph.nodes) {
        if(node.parent_id !== "") {
            if (node.status === NodeStatusStarted || node.status === NodeStatusWatched) {
                inProgressNodes.push(node);
            } else if (!prereqMap.has(node.id) && node.status !== NodeStatusFinished) {
                nextNodes.push(node);
                node.status = NodeStatusNext;
            }
        }
    }

    const parentMap = computeParentMap(graph);
    for (const node of graph.nodes) {
        if (node.parent_id === "") {
            let allChildrenFinished = true;
            const children = parentMap.get(node.id) || []
            if (children.length === 0) {
                continue
            }
            for (const child of children) {
                if (child.status !== NodeStatusFinished) {
                    allChildrenFinished = false;
                    break
                }
            }
            if (allChildrenFinished){
                node.status = NodeStatusFinished;
                continue
            }
            let nodeStarted = false;
            for (const child of children) {
                if (child.status === NodeStatusStarted || child.status === NodeStatusWatched) {
                    nodeStarted = true;
                    break
                }
            }
            if (nodeStarted) {
                node.status = NodeStatusStarted;
                continue
            }
            for (const child of children) {
                if (child.status === NodeStatusNext) {
                    node.status = NodeStatusNext;
                    break
                }
            }

        }
    }

    nextNodes.sort(nodeCmpFn);
    inProgressNodes.sort(nodeCmpFn);

    return [inProgressNodes, nextNodes];
}

const nodeCmpFn = (a: Node, b: Node) => {
    if (a.node_type === b.node_type) {
        const name1 = a.name.toUpperCase();
        const name2 = b.name.toUpperCase();
        if (name1 > name2) {
            return 1;
        } else if (name1 < name2) {
            return -1;
        } else {
            return 0;
        }
    }
    const nodeTypeMap = new Map();

    nodeTypeMap
        .set(NodeTypeLecture, 3)
        .set(NodeTypeExample, 2)
        .set(NodeTypeAssignment, 1);
    return nodeTypeMap.get(a.node_type) - nodeTypeMap.get(b.node_type);
}

const generateReverseGraph = (nodes: Node[], links: Link[]): Map<string, string[]> => {
    const graph: Map<string, string[]> = new Map();

    // Initialize the graph with empty arrays for each node
    for (const node of nodes) {
        graph.set(node.id, []);
    }

    // Populate the graph based on the links
    for (const l of links) {
        const link = castToLink(l)
        if (graph.has(link.source) && graph.has(link.target)) {
            graph.get(link.target)!.push(link.source);
        }
    }

    return graph;
}


const generateGraph = (nodes: Node[], links: Link[]): Map<string, string[]> => {
    const graph: Map<string, string[]> = new Map();

    // Initialize the graph with empty arrays for each node
    for (const node of nodes) {
        graph.set(node.id, []);
    }

    // Populate the graph based on the links
    for (const l of links) {
        const link = castToLink(l)
        if (graph.has(link.source) && graph.has(link.target)) {
            graph.get(link.source)!.push(link.target);
        }
    }

    return graph;
}
