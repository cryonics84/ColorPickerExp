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
    reset: reset,
    addHint: addHint
};

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------
function init(client){

    netframe.init(client);
    modelController.init();

    netframe.shouldLog(true);

    netframe.addClientConnectedCallback(clientConnected);
    netframe.addClientDisconnectedCallback(clientDisconnected);
    netframe.addEndStageCallback(endStage);
    view.init();

    loadLobby();
}


function endStage(){
    netframe.log('endStage() called..');
    view.reset();
    netframe.removeEndStageCallback(endStage);
    netframe.reset();
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

function startRound(roundIndex, currentRound){
    netframe.log('startRound() called in clientController');
    view.startRound(currentRound);
}

function loadLobby(){
    netframe.log('loadLobby() called on clientController');
    view.loadLobby();
}

function loadSocialScene(){
    netframe.log('loadSocialScene() called on clientController');
    view.loadAvatarScene();
}

function loadFinalScene(score){
    netframe.log('loadFinalScene() called on clientController');
    view.loadFinalScene(score);
}

function reset(){
    view.reset();
}

function addHint(hint){
    netframe.log('addHint() called on clientController');
    view.addHint("test");
}

//---------------------------------------------------------------
// Commands
//---------------------------------------------------------------
function cmdSelectBubble(bubbleId, mouseData){
    netframe.log('You selected bubble id: ' + bubbleId);
    netframe.makeCmd('cmdSelectBubble', [bubbleId, netframe.getClientId(), mouseData]);
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