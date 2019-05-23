import model from '../model/model'
import {sharedInterface as netframe} from '../../lib/netframe'
import view from "../../client/client-view";
import {NetworkStates} from "../../lib/entity";

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

let gameManager;
let networkIdentityColors = ['red', 'yellow', 'white', 'pink', 'cyan', 'orange'];

//---------------------------------------------------------------
//  functions
//---------------------------------------------------------------

function createBubble(id, moneyGroupId){
    let cardGroup = new model.Bubble(id, moneyGroupId);
    netframe.log('Created Bubble: ' + JSON.stringify(cardGroup));
    return cardGroup;
}

function createMoneyGroup(id, value){
    let moneyGroup = new model.MoneyGroup(id, value);
    netframe.log('Created MoneyGroup: ' + JSON.stringify(moneyGroup));
    return moneyGroup;
}

function createCardSet(moneyGroups){
    netframe.log('createCardSet() called on modelController');
    gameManager.moneyGroups = moneyGroups;
}

function startRound(roundIndex, currentRound) {
    netframe.log('startRound() called in modelController with roundPlayerIndex: ' + roundIndex + ', round: ' + currentRound);
    gameManager.round[roundIndex] = currentRound;

    for (let identityIndex in netframe.getNetworkIdentities()) {
        let networkIdentity = netframe.getNetworkIdentities()[identityIndex]
        networkIdentity.selectedPartipant = [];
        networkIdentity.isReady = false;
    }
}

function playerSelectBubble(bubbleIdGuess, colorAnswer, money, clientId, round){
    netframe.log('playerSelectBubble() called with bubbleIdGuess: ' + bubbleIdGuess + ', and clientId: ' + clientId);

    let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
    networkIdentity.selectedBubble = getCardGroupById(bubbleIdGuess);

    networkIdentity.lastScore = money;
    networkIdentity.totalScore += money;
    netframe.log('Setting score: ' + money +', of round: '  + round + ', for client: ' + clientId);
    networkIdentity.scores[round] = money;

    netframe.log('Set networkIdentity: ' + JSON.stringify(networkIdentity));

}

function selectedParticipant(networkIdentity, round, selectedParticipants){
    netframe.log('selectedParticipant() called on modelController');

    netframe.log('networkIdentity: ' + JSON.stringify(networkIdentity));
    netframe.log('round: ' + round);
    netframe.log('networkIdentity.selectedParticipants: ' + JSON.stringify(networkIdentity['selectedParticipants']));

    netframe.log('selectedParticipants[round]: ' + JSON.stringify(selectedParticipants));
    networkIdentity['selectedParticipants'][round] = selectedParticipants;
    netframe.log('totalScore: ' + JSON.stringify(networkIdentity.totalScore));
    networkIdentity.totalScore -= 50 * selectedParticipants.length;
    netframe.log('scores[round]: ' + JSON.stringify(networkIdentity.scores[round]));
    networkIdentity.scores[round] -= 50 * selectedParticipants.length;
    
}

function hasEveryoneFinishedSocial(round){
    
    let allReady = true;
	netframe.log('Checking if all participants are ready...');
	let networkIdentities = netframe.getNetworkIdentities();
	for(let i in networkIdentities){
		if(!networkIdentities[i].selectedParticipants[round]){
			allReady = false;
			break;
		}
	}

    return allReady;
}

function loadLobby(){
    netframe.log('loadLobby called() on modelController');
}

function loadSocialScene(){
    netframe.log('loadSocialScene() called on modelController');
}

function loadFinalScene(score){
    netframe.log('loadFinalScene() called on modelController');
}


function createGameManager(){
    netframe.log('creating game manager: ');
    gameManager = new model.GameManager();
    netframe.log('created : ' + JSON.stringify(gameManager));

    return gameManager;
}

function reset(){
    let networkIdentities = Object.values(netframe.getNetworkIdentities());
    for (let ni in networkIdentities){

        networkIdentities[ni].state = NetworkStates.JOINED;
        networkIdentities[ni].selectedBubble = null;
        //networkIdentities[ni].contributionFactor = 0;
        networkIdentities[ni].popularityFactor = 0;
        networkIdentities[ni].isReady = false;
        networkIdentities[ni].selectedPartipants = [];
        networkIdentities[ni].totalScore = 0;
        networkIdentities[ni].scores = [];
        networkIdentities[ni].isReady = false;
        networkIdentities[ni].finalScore = 0;
    }
}

//---------------------------------------------------------------
// getters and util functions
//---------------------------------------------------------------
function getCardGroupById(id){
    netframe.log('groupCardGroupById() called with ID: ' + id);

    for(let mg in gameManager.moneyGroups){
        for(let cg in gameManager.moneyGroups[mg].bubbles){
            let cardGroup = gameManager.moneyGroups[mg].bubbles[cg];
            if(cardGroup.id == id){
                netframe.log('Found CardGroup: ' + cardGroup);
                return cardGroup;
            }
        }
    }
    netframe.log('Failed to find CardGroup...');
    return null;
}

function setMaxPlayers(amount){
    netframe.log('setNumberOfPlayers() called on modelController with: ' + Number(amount));
    gameManager.numberOfPlayers = Number(amount);
}

function setNumberOfRounds(amount){
    netframe.log('setNumberOfRounds() called on modelController with: ' + Number(amount));
    gameManager.totalRounds = Number(amount);
}

function getNetworkIdentityColors(){
    return networkIdentityColors;
}

function getGameManager(){
    return gameManager;
}

function setGameManager(instance){
    gameManager = instance;
}

//---------------------------------------------------------------
// core callback
//---------------------------------------------------------------

function init(){
    netframe.addEndStageCallback(endStageCallback);

    gameManager = new model.GameManager();
}


function endStageCallback(){
    
}

//---------------------------------------------------------------
// Interface
//---------------------------------------------------------------

export default {
    init: init,
    getNetworkIdentityColors: getNetworkIdentityColors,
    createGameManager: createGameManager,
    getGameManager: getGameManager,
    setGameManager: setGameManager,
    createCardSet: createCardSet,
    createBubble: createBubble,
    createMoneyGroup: createMoneyGroup,
    getCardGroupById: getCardGroupById,
    playerSelectBubble: playerSelectBubble,
    startRound: startRound,
    loadLobby: loadLobby,
    loadSocialScene: loadSocialScene,
    selectedParticipant: selectedParticipant,
    reset: reset,
    setMaxPlayers: setMaxPlayers,
    setNumberOfRounds: setNumberOfRounds,
    loadFinalScene: loadFinalScene,
    hasEveryoneFinishedSocial: hasEveryoneFinishedSocial
};
