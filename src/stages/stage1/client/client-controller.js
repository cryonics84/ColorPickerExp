import model from "../shared/model/model";
import view from './client-view'
import {clientSharedInterface as netframe} from '../lib/netframe'
import modelController from '../shared/controller/controller'
import * as monsterr from "monsterr";

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

export const NetworkStates = { LOBBY: 0, BUBBLE: 1, REWARD: 2, CERTAINTY: 3, SOCIAL: 4, FINISHED: 5, READYBUBBLE: 6, WAITINGFORSOCIAL: 7};

const rpcs = {
    playerSelectBubble: playerSelectBubble,
    loadLobby: loadLobby,
    loadSocialScene: loadSocialScene,
    loadFinalScene: loadFinalScene,
    reset: reset,
    addHint: addHint,
    updateState: updateState
};

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------
function init(client){

    netframe.init(client);
    modelController.init();

    netframe.shouldLog(true);

    //netframe.addClientConnectedCallback(clientConnected);
    //netframe.addClientDisconnectedCallback(clientDisconnected);
    netframe.addEndStageCallback(endStage);
    view.init();

    //loadLobby();
    setTimeout(
        function () {
            cmdRequestState(true);
        }, 1000);
    //cmdRequestState();
}


function endStage(){
    netframe.log('endStage() called..');
    view.reset();
    netframe.removeEndStageCallback(endStage);
    netframe.reset();
}


function clientConnected(){
    netframe.log('clientConnected called on client-controller');
    //view.updateGUI();
}

function clientDisconnected(){
    netframe.log('clientDisconnected called on client-controller');
    //view.updateGUI();
}

//---------------------------------------------------------------
// client functions
//---------------------------------------------------------------


function updateState(stateObj){
    netframe.log('updateState() was called with: ' + JSON.stringify(stateObj));

	switch (stateObj.state){
	case NetworkStates.LOBBY:
        setLobbyState(stateObj.stateData);
		break;
	case NetworkStates.BUBBLE:
		setBubbleState(stateObj.stateData);
		break;
	case NetworkStates.REWARD:
        setRewardState(stateObj.stateData);
		break;
	case NetworkStates.CERTAINTY:
        setCertaintyState(stateObj.stateData);
		break;
	case NetworkStates.SOCIAL:
        setSocialState(stateObj.stateData);
		break;
	case NetworkStates.FINISHED:
        setFinishedState(stateObj.stateData);
		break;
	case NetworkStates.READYBUBBLE:
		//setBubbleState(stateObj.stateData);
	}

}

function setLobbyState(stateData){
    netframe.log('setLobbyState() was called');
    view.loadLobby(stateData.round, stateData.maxRounds, stateData.numberOfPlayers, stateData.maxPlayers);
}

function setBubbleState(stateData){
    netframe.log('setBubbleState() was called');
	view.startRound(stateData.moneyGroups, stateData.round, stateData.maxRounds);
}

function setCertaintyState(stateData){
    view.loadCertaintyScene();
}

function setSocialState(stateData){
    view.loadSocialScene(stateData.networkIdentitiesData);
}

function setRewardState(stateData){
    view.loadRewardScene(stateData.selectedBubble, stateData.money)
}

function setFinishedState(stateData){
    view.loadFinalScene(stateData.finalScore);
}

function setReadyBubbleState(){
	view.startRound(currentRound);
}


function playerSelectBubble(bubbleIdGuess, colorAnswer, money, clientId){
    if(clientId === netframe.getClientId()){
        view.loadRewardScene(bubbleIdGuess, colorAnswer, money);
    }
}
/*
function startRound(currentRound){
    netframe.log('startRound() called in clientController');
    view.startRound(currentRound);
}
*/
function loadLobby(){
    netframe.log('loadLobby() called on clientController');
    view.loadLobby(round, maxRound);
}

function loadSocialScene(){
    netframe.log('loadSocialScene() called on clientController');
    view.loadSocialScene();
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
    netframe.log('cmdSelectParticipant() called with: ' + JSON.stringify(arguments));
    netframe.makeCmd('cmdSelectParticipant', [netframe.getClientId(), selectedParticipants, mouseData]);
}

function cmdFinishedGame(canvasSize){
    netframe.log('cmdFinishedGame() called with canvasSize: ' + canvasSize);
    netframe.makeCmd('cmdFinishedGame', [canvasSize, netframe.getClientId()]);
}


function cmdRequestState(){
    netframe.log('cmdRequestState() was called');
    netframe.makeCmd('cmdRequestState', [netframe.getClientId()]);
}

function cmdSelectedCertainty(certainty){
    netframe.log('cmdSelectedCertainty() was called');
    netframe.makeCmd('cmdSelectedCertainty', [netframe.getClientId(), certainty]);
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
    cmdSelectedCertainty: cmdSelectedCertainty,
    rpcs: rpcs
}