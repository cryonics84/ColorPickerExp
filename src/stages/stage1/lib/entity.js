import rpcController from '../shared/controller/controller';
import prox from "./proxy";
import {sharedInterface as netframe} from "./netframe";

export function makePrivVar(obj, name){
    Object.defineProperty(obj, name, {
        enumerable: false,
        writable: true
    });
}

// Base class that all entities inherit from
export class Entity {
    constructor(entityId, owner){
        this.id = entityId;
        this.owner = owner;
    }

    spawnView(){
        netframe.log('spawnView called in super');
    }

    removeView(){
        netframe.log('removeView called in super');
    }
}

export class NetworkIdentity {
    constructor(identityId, clientId, name, color){
        this.identityId = identityId;
        this.clientId = clientId;
        this.name = name;
        this.color = color;
        this.state = NetworkStates.JOINED;

        this.selectedBubble = null;

        this.contributionFactor = 0;
        this.popularityFactor = 0;
        this.isReady = false;
        this.selectedPartipants = [];
        this.totalScore = 0;

        this.isReady = false;
    }
}

// JOINED => LOADING
// LOADING => WAITING || PLAYING
// PLAYING => DISCONNECTED || FINISHED
// DISCONNECTED => JOINED
export const NetworkStates = { JOINED: 0, LOADING: 1, WAITING: 2, PLAYING: 3, DISCONNECTED: 4, FINISHED: 5};

/*
const IEntity = {
    Entity: Entity,
    NetworkIdentity: NetworkIdentity,
    makePrivVar: makePrivVar
};

export default IEntity;

*/


