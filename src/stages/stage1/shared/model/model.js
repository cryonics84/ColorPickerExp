//Class composition
//https://alligator.io/js/class-composition/

//private methods/variables - stackoveflow post by Son JoungHo
//https://stackoverflow.com/questions/27849064/how-to-implement-private-method-in-es6-class-with-traceur

//Mixins
//http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/

import compose from "lodash/fp/compose"
//import mix, {Entity} from './classMixer';

import modelController from '../controller/controller';
import {Entity, NetworkIdentity} from "../../lib/entity";
import {Mixin, mix} from "../../lib/mixwith";
import  {sharedInterface as netframe} from '../../lib/netframe'
import view from "../../client/client-view";

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

class GameManager extends Entity{
    constructor(entityId){
        super(entityId, null);

        this.GAMESTATES = { WAITING: 0, PLAYING: 1, GAME_OVER: 2};
        this.COLORS = { RED: 0, GREEN: 1, BLUE: 2, YELLOW: 3, PURPLE: 4, PINK: 5};

        this.DISTRUBUTION = {RED: 10, GREEN: 15, BLUE: 8, YELLOW: 7, PURPLE: 5, PINK: 15}; // 60

        this.gameState = this.GAMESTATES.WAITING;
        this.selectedColor = null;
        this.moneyGroups = [];
        this.round = 0;
        this.maxRounds = 1;
        this.numberOfPlayers = 4;
        this.gameMode = "risky";
    }

    spawnView(){
        //if(callbacks) callbacks.createGameManagerView();
    }
}


const IModel = {
    Bubble: Bubble,
    MoneyGroup: MoneyGroup,
    GameManager: GameManager,
    setCallbackMap: setCallbackMap
};

export default IModel;