import model from '../model/model'
import {sharedInterface as netframe} from '../../lib/netframe'
import view from "../../client/client-view";

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

let gameManager;
let networkIdentityColors = ['red', 'yellow', 'white', 'pink', 'cyan', 'orange'];

//---------------------------------------------------------------
// entity functions
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

function startRound(currentRound) {
    netframe.log('startRound() called in modelController');
    gameManager.round = currentRound;

    for (let identityIndex in netframe.getNetworkIdentities()) {
        let networkIdentity = netframe.getNetworkIdentities()[identityIndex]
        networkIdentity.selectedPartipant = [];
        networkIdentity.isReady = false;
    }
}

function playerSelectBubble(bubbleIdGuess, colorAnswer, money, clientId){
    netframe.log('playerSelectBubble() called with bubbleIdGuess: ' + bubbleIdGuess + ', and clientId: ' + clientId);

    let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
    networkIdentity.selectedBubble = getCardGroupById(bubbleIdGuess);

    networkIdentity.totalScore += money;

    netframe.log('Set networkIdentity: ' + JSON.stringify(networkIdentity));

}

function selectedParticipant(clientId, selectedParticipantsId){
    netframe.log('selectedParticipant() called on modelController');

    let identity = netframe.getNetworkIdentityFromClientId(clientId);
    identity.isReady = true;
    identity.selectedPartipants = selectedParticipantsId;

    for(let i in selectedParticipantsId){
        netframe.getNetworkIdentityFromClientId(selectedParticipantsId[i]).popularityFactor++;
    }

}

function loadLobby(){
    netframe.log('loadLobby called() on modelController');
}

function loadSocialScene(){
    netframe.log('loadSocialScene() called on modelController');
}

function loadFinalScene(){
    netframe.log('loadFinalScene() called on modelController');
}

function moveEntity(entityId, direction){
    netframe.log('moveEntity called() on model Controller');
    let entity = netframe.getEntity(entityId);
    entity.move(direction);
}

function createGameManager(entityId){
    netframe.log('creating game manager: ' + entityId);
    gameManager = new model.GameManager(entityId);
    netframe.log('created : ' + JSON.stringify(gameManager));
    netframe.updateEntity(gameManager.id, gameManager);

    return gameManager;
}

function reset(){}

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

function setNumberOfPlayers(amount){
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
    netframe.addRemoveEntityCallback(removeEntityCallback);
    netframe.addEndStageCallback(endStageCallback);

    gameManager = new model.GameManager();
}

function removeEntityCallback(entity){
    netframe.log('removeEntityCallback() called on modelController with entity id: ' + entity.id);
    if(entity instanceof model.Card){
        gameManager.removePlayer(entity.id);
    }
}

function endStageCallback(){
    netframe.removeRemoveEntityCallback(removeEntityCallback);
}

//---------------------------------------------------------------
// Interface
//---------------------------------------------------------------

export default {
    init: init,
    moveEntity: moveEntity,
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
    setNumberOfPlayers: setNumberOfPlayers,
    setNumberOfRounds: setNumberOfRounds
};
