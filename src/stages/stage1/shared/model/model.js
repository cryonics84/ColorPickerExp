import compose from 'lodash/fp/compose';

import modelController from '../controller/controller';
import {NetworkIdentity} from '../../lib/entity';
import {Mixin, mix} from '../../lib/mixwith';
import  {sharedInterface as netframe} from '../../lib/netframe';
import view from '../../client/client-view';

let callbacks;



function setCallbackMap(callbackMap){
	callbacks = callbackMap;
}

class MoneyGroup {
	constructor(id, value) {
		this.id = id;
		this.value = value;
		this.bubbles = [];
	}
}

class Bubble {
	constructor(id, moneyGroupId) {
		this.id = id;
		this.moneyGroupId = moneyGroupId;
		this.colors = [];
	}
}

class GameManager {
	constructor(){
		this.GAMESTATES = { WAITING: 0, PLAYING: 1, GAME_OVER: 2};
		this.COLORS = { RED: 0, GREEN: 1, BLUE: 2, YELLOW: 3, PURPLE: 4, ORANGE: 5};

		this.DISTRUBUTION = {RED: 10, GREEN: 15, BLUE: 8, YELLOW: 7, PURPLE: 5, ORANGE: 15}; // 60

		this.gameState = this.GAMESTATES.WAITING;
		this.selectedColor = null;
		this.moneyGroups = [];
		this.round = [];
		this.maxRounds = 1;
		this.maxPlayers = 4;
		this.gameMode = 'risky';

		this.numberOfRandomScores = 1;
		this.scoreMultiplier = 0.05;
		this.finalScore = 0;
	}
}


const IModel = {
	Bubble: Bubble,
	MoneyGroup: MoneyGroup,
	GameManager: GameManager,
	setCallbackMap: setCallbackMap
};

export default IModel;
