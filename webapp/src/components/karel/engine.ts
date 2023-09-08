import {World, deepCopyWorld,
    move as karelMove,
    pickBeeper as karelPickBeeper,
    putBeeper as karelPutBeeper,
    turnAround as karelTurnAround,
    turnLeft as karelTurnLeft,
    turnRight as karelTurnRight,
    frontIsClear as karelFrontIsClear,
    rightIsClear as karelRightIsClear,
    leftIsClear as karelLeftIsClear,
    beepersPresent as karelBeepersPresent,
} from "./types";

const MAX_ACTIONS = 10000;
const MOVE = 'move'
const TURN_LEFT = 'turnLeft'
const TURN_RIGHT = 'turnRight'
const PUT_BEEPER = 'putBeeper'
const PICK_BEEPER = 'pickBeeper'
const TURN_AROUND = 'turnAround'

export type Engine = {
    actionBuffer: string[]
    actionIndex: number
    virtualWorld: World
}

let engine: Engine = {
    actionBuffer: [],
    actionIndex: 0,
    virtualWorld: {} as World,
}

export const newEngine = () => {
    engine = {
        actionBuffer: [],
        actionIndex: 0,
        virtualWorld: {} as World,
    }
}

export const compile = (world: World, code: string) => {
    engine.virtualWorld = deepCopyWorld(world);
    engine.actionBuffer = [];
    engine.actionIndex = 0;
    eval(code);
}

export const compileJava = (world: World, javaCode: string) => {
    const jsCode = translateJavaToJS(javaCode)
    engine.virtualWorld = deepCopyWorld(world);
    engine.actionBuffer = [];
    engine.actionIndex = 0;
    eval(jsCode);
}


export const getEngine = (): Engine => {
    return engine;
}

const translateJavaToJS= (javaCode: string): string => {
    let jsCode = javaCode;

    // Convert System.out.println to console.log
    jsCode = jsCode.replace(/System\.out\.println/g, "console.log");

    // Remove data types for variable declarations
    jsCode = jsCode.replace(/(int|float|double|String|char|long|boolean)\s+/g, "let ");

    // Replace 'public static void main' with a simple function name
    jsCode = jsCode.replace(/public void run[^{]*{/, "function main() {");

    jsCode = jsCode.replace(/private void/g, "function");

    jsCode = jsCode.replace(/import stanford.karel.*;/g, "");

    jsCode = jsCode.replace(/public class [\s\S]*? {/, "");
    jsCode = jsCode.replace(/(.*)(\})([^}]*$)/, "$1$3");

    jsCode += "\nmain();\n";

    return jsCode;
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const turnRight = () => {
    karelTurnRight(engine.virtualWorld);
    addToActionBuffer(engine, TURN_RIGHT);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const turnAround = () => {
    addToActionBuffer(engine, TURN_AROUND);
    karelTurnAround(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const move = () => {
    addToActionBuffer(engine, MOVE);
    try {
        karelMove(engine.virtualWorld);
    } catch(err){
        throw new Error('Karel is blocked');
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const turnLeft = () => {
    addToActionBuffer(engine, TURN_LEFT);
    karelTurnLeft(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pickBeeper = () => {
    addToActionBuffer(engine, PICK_BEEPER);
    karelPickBeeper(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const putBeeper = () => {
    addToActionBuffer(engine, PUT_BEEPER);
    karelPutBeeper(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const frontIsClear = () => {
    return karelFrontIsClear(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const frontIsBlocked = () => {
    return !karelFrontIsClear(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rightIsClear = () => {
    return karelRightIsClear(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rightIsBlocked = () => {
    return !karelRightIsClear(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const leftIsClear = () => {
    return karelLeftIsClear(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const leftISBlocked = () => {
    return !karelLeftIsClear(engine.virtualWorld);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const beepersPresent = () => {
    return karelBeepersPresent(engine.virtualWorld);
}

export const executeStep = (e: Engine, world: World): boolean => {
    if (engine.actionIndex >= engine.actionBuffer.length || e.actionIndex == -1) {
        return true;
    }

    const action = e.actionBuffer[e.actionIndex];
    e.actionIndex = e.actionIndex + 1;

    switch(action) {
    case MOVE: karelMove(world); break;
    case TURN_LEFT: karelTurnLeft(world); break;
    case TURN_RIGHT: karelTurnRight(world); break;
    case PUT_BEEPER: karelPutBeeper(world); break;
    case PICK_BEEPER: karelPickBeeper(world); break;
    case TURN_AROUND: karelTurnAround(world); break;
    default: alert("invalid action"); break;
    }

    return false;
}

const addToActionBuffer = (e: Engine, action: string) => {
    if (e.actionBuffer.length > MAX_ACTIONS) {
        throw new Error("infinite loop");
    }
    e.actionBuffer.push(action);
}


