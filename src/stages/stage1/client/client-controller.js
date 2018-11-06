import model from "../shared/model/model";
import view from './client-view'
import {clientSharedInterface as netframe} from '../lib/netframe'
import modelController from '../shared/controller/controller'
import * as monsterr from "monsterr";

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

const rpcs = {
    playerSelectBubble: playerSelectBubble,
    startRound: startRound,
    loadLobby: loadLobby,
    loadSocialScene: loadSocialScene,
    loadFinalScene: loadFinalScene,
    reset: reset
};

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------
function init(client){
    //we need to add the remove entity callback to the model controller before the view



    netframe.init(client);
    modelController.init();

    netframe.shouldLog(true);
    netframe.addCreateEntityCallback(createEntity);
    netframe.addRemoveEntityCallback(removeEntity);
    netframe.addClientConnectedCallback(clientConnected);
    netframe.addClientDisconnectedCallback(clientDisconnected);
    netframe.addEndStageCallback(endStage);
    view.init();

    loadLobby();
}


function endStage(){
    netframe.log('endStage() called..');
    view.reset();
    netframe.removeCreateEntityCallback(createEntity);
    netframe.removeRemoveEntityCallback(removeEntity);
    netframe.removeEndStageCallback(endStage);
    netframe.reset();
}

function createEntity(entity){
    netframe.log('createEntity was called on client-controller with entity: ' + JSON.stringify(entity));

    switch (netframe.getClassNameOfEntity(entity)) {

        case 'GameManager':
            netframe.log('Entity is GameManager');
            modelController.setGameManager(entity);
            break;
        default:
            netframe.log('Entity is UNKNOWN Class');
            break;
    }

    entity.spawnView();
}

function removeEntity(entity){
    netframe.log('removeEntity() called on client-controller with entity id: ' + entity.id);
    entity.removeView();
}

function clientConnected(){
    netframe.log('clientConnected called on client-controller');
    view.updateGUI();
}

function clientDisconnected(){
    netframe.log('clientDisconnected called on client-controller');
    view.updateGUI();
}

//---------------------------------------------------------------
// client functions
//---------------------------------------------------------------

function playerSelectBubble(bubbleIdGuess, colorAnswer, money, clientId){
    if(clientId === netframe.getClientId()){
        view.loadRewardScene(bubbleIdGuess, colorAnswer, money);
    }
}

function startRound(){
    netframe.log('startRound() called in clientController');
    view.startRound();
}

function loadLobby(){
    netframe.log('loadLobby() called on clientController');
    view.loadLobby();
}

function loadSocialScene(){
    netframe.log('loadSocialScene() called on clientController');
    view.loadAvatarScene();
}

function loadFinalScene(){
    netframe.log('loadFinalScene() called on clientController');
    view.loadFinalScene();
}

function reset(){
    view.reset();
}


//---------------------------------------------------------------
// Commands
//---------------------------------------------------------------
function cmdSelectBubble(bubble, mouseData){
    netframe.log('You selected bubble id: ' + bubble.id);
    netframe.makeCmd('cmdSelectBubble', [bubble.id, bubble.moneyGroupId, netframe.getClientId(), mouseData]);
}

function cmdSelectParticipant(selectedParticipants, mouseData){
    netframe.log('cmdSelectParticipant() called with: ' + arguments);
    netframe.getMyNetworkIdentity().selectedPartipant = selectedParticipants;
    netframe.makeCmd('cmdSelectParticipant', [netframe.getClientId(), selectedParticipants, mouseData]);
}

function cmdFinishedGame(canvasSize){
    netframe.log('cmdFinishedGame() called with canvasSize: ' + canvasSize);
    netframe.makeCmd('cmdFinishedGame', [canvasSize, netframe.getClientId()]);
}

//---------------------------------------------------------------
// RPC
//---------------------------------------------------------------



//---------------------------------------------------------------
// Interface
//---------------------------------------------------------------
export default {
    init: init,
    cmdSelectBubble: cmdSelectBubble,
    cmdSelectParticipant: cmdSelectParticipant,
    cmdFinishedGame: cmdFinishedGame,
    rpcs: rpcs
}