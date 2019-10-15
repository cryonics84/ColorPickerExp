import rpcController from '../shared/controller/controller';
import prox from './proxy';
import {sharedInterface as netframe} from './netframe';

export function makePrivVar(obj, name){
	Object.defineProperty(obj, name, {
		enumerable: false,
		writable: true
	});
}

export class NetworkIdentity {

	constructor(identityId, clientId, name, color){
		this.identityId = identityId;
		this.clientId = clientId;
		this.password = '';
		this.name = name;
		this.color = color;
		this.state = NetworkStates.LOBBY;

		this.selectedBubble = null;

		//this.contributionFactor = 0;
		this.popularityFactor = 0;
		this.isReady = false;
		this.selectedParticipants = [];
		this.totalScore = 0;
		this.lastScore = 0;
		this.scores = [];
		this.isReady = false;

        this.connectionState = ConnectionStates.CONNECTED;

        this.playerId = -1;
        this.visibleClients = [];
	}
}


export class Session
{
	constructor(sessionId, clients, sessionData){
		// Unique key
		this.sessionId = sessionId;

		// Client IDs array for this session
		this.clients = clients;

		this.sessionData = sessionData;
	}
}

export const ConnectionStates = { CONNECTED: 1, DISCONNECTED: 2};
export const NetworkStates = { LOBBY: 0, BUBBLE: 1, REWARD: 2, CERTAINTY: 3, SOCIAL: 4, FINISHED: 5, WAITINGFORSOCIAL: 6, LOGIN: 7};

export class ClientState {
	constructor(){
		
	}
}

export class RewardState {
	constructor(score){
		this.score = score;
	}
}

export class FinishedState {
	constructor(score){
		this.score = score;
	}
}

/*
const IEntity = {
    NetworkIdentity: NetworkIdentity,
    makePrivVar: makePrivVar
};

export default IEntity;

*/


