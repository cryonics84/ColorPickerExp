import model from '../shared/model/model'
import modelController from '../shared/controller/controller'
import {hasMixin} from "../lib/mixwith";
import {serverSharedInterface as netframe} from '../lib/netframe';
import bubbleCollection from './bubbles'
import * as dataClasses from "../shared/model/data";
import * as db from "../../sharedDB";

let fs  = require('fs');
//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------



let answers = [];

let gameData;



//---------------------------------------------------------------
// Commands
//---------------------------------------------------------------

// Command from client
function cmdSelectBubble(bubbleIdGuess, moneyGroupId, clientId, mouseData){
    netframe.log('called cmdSelectBubble() on server with bubble id: ' + bubbleIdGuess + ', moneyGroupId: ' + moneyGroupId + ', and networkIdentity: ' + clientId);
    let colorAnswer = answers[modelController.getGameManager().round-1];
    let moneyGroup = modelController.getGameManager().moneyGroups[moneyGroupId - 1];
    let bubble = modelController.getCardGroupById(bubbleIdGuess);

    netframe.log('Found colorAnswer: ' + colorAnswer);
    netframe.log('Found moneyGroup: ' + JSON.stringify(moneyGroup));
    netframe.log('Found bubble: ' + JSON.stringify(bubble));

    let money = 0;
    //did user guess correct?
    if(bubble.colors.includes(colorAnswer)){
        money = moneyGroup.value;
        netframe.log('User guessed correct!');
    }else{
        netframe.log('User guessed wrong!');
        money = -moneyGroup.value;
    }

    netframe.makeRPC('playerSelectBubble', [bubbleIdGuess, colorAnswer, money, clientId]);

    //Save data
    netframe.log('Saving bubble data...');

    let identity = netframe.getNetworkIdentityFromClientId(clientId);
    let bubbleSceneData = new dataClasses.BubbleSceneData(bubble.colors, moneyGroup.value, money, mouseData);
    gameData.roundData[modelController.getGameManager().round-1].participantRoundData[identity.identityId].bubbleSceneData.push(bubbleSceneData);

    netframe.log('Saved game data: ' + JSON.stringify(gameData));

    //TODO: Insert check to see if everyone is ready for Social round
    let allReady = true;
    let networkIdentities =  Object.values(netframe.getNetworkIdentities());
    netframe.log('Checking if all participants are ready...');
    for(let i in networkIdentities){
        netframe.log('NetworkIdentity: ' + JSON.stringify(networkIdentities[i]));
        if(!networkIdentities[i].selectedBubble){
            allReady = false;
            break;
        }
    }

    if(allReady){
        if(modelController.getGameManager().round >= modelController.getGameManager().maxRounds) {
            setTimeout(
                function () {
                    gameOver();
                }, 3000);
        }else{
            // Transition to new round (bubble scene)
            setTimeout(
                function() {
                    for(let i in networkIdentities){
                        networkIdentities[i].selectedBubble = null;
                    }
                    netframe.makeRPC('loadSocialScene', []);
                }, 4000);
        }


    }
}

function cmdSelectParticipant(clientId, selectedParticipantsId, mouseData){
    let identity = netframe.getNetworkIdentityFromClientId(clientId);


    netframe.makeRPC('selectedParticipant',[clientId, selectedParticipantsId]);

    // Save data
    let socialSceneData = new dataClasses.SocialSceneData(identity.contributionFactor, identity.popularityFactor, selectedParticipantsId, mouseData);
    gameData.roundData[modelController.getGameManager().round-1].participantRoundData[identity.identityId].socialSceneData.push(socialSceneData);

    //TODO: Insert check to see if everyone is ready for Bubble round
    let allReady = true;
    netframe.log('Checking if all participants are ready...');
    let networkIdentities =  Object.values(netframe.getNetworkIdentities());
    for(let i in networkIdentities){
        if(!networkIdentities[i].isReady){
            allReady = false;
            break;
        }
    }

    if(allReady){
        // Transition to new round (bubble scene)
        setTimeout(
            function() {
                startRound();
            }, 500);

    }

}

const commands = {
    'cmdSelectBubble': cmdSelectBubble,
    'cmdSelectParticipant': cmdSelectParticipant
};

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------

function init(serverInstance){

    //initiate NetFrame (always do first)
    netframe.init(serverInstance); // initialize NetFrame and set server reference

    //initiate modelController
    modelController.init();

    // Setup
    netframe.shouldLog(true); // stop logging
    netframe.addUpdateCallback(update); // add update callback
    netframe.addClientConnectedCallback(clientConnected); // add client connected callback
    netframe.startLoop(10); // start server update with X ms interval - stop again with stopLoop()

    createGameManager();
    initData();

    createFixedCards();

    //createUniformAnswers();
    //createDistributedAnswers();
}

// Gets called from netframe after each update
function update(){}

// Gets called from netframe when a client has joined a stage
function clientConnected(client, networkIdentity){
    netframe.log('clientConnected() callback called on server-controller...');

    netframe.log('Checking if all players are ready... Max players are: ' + modelController.getGameManager().numberOfPlayers + ', current number of players: ' + netframe.getNetworkIdentitiesSize());

    if(modelController.getGameManager().gameState === modelController.getGameManager().GAMESTATES.WAITING){
        netframe.log('Game is in waiting mode..');
        if(netframe.getNetworkIdentitiesSize() === modelController.getGameManager().numberOfPlayers){
            netframe.log('Game is starting soon...');

            setTimeout(startRound, 3000);
        }else{
            netframe.log('Not all players are here yet...');
            netframe.log('Size type: ' + typeof netframe.getNetworkIdentitiesSize());
            netframe.log('numberOfPlayers type: ' + typeof modelController.getGameManager().numberOfPlayers);
        }
    }else{
        netframe.log('Game is NOT in waiting mode..');
    }

    //netframe.getServer().send('printEntities', Object.values(netframe.getNetworkIdentities())).toAdmin();
}


//---------------------------------------------------------------
// Controller functions
//---------------------------------------------------------------

function startRound(){
    netframe.log('Starting round...');
    modelController.getGameManager().round = modelController.getGameManager().round + 1;

    let participantRoundDataArr = {};

    netframe.log('Iterating network identities to create participantRoundData...');
    let networkIdentities = Object.values(netframe.getNetworkIdentities());
    for(let identityIndex in networkIdentities){

        //let id = networkIdentities[identityIndex].identityId;
        let id = networkIdentities[identityIndex].identityId;
        let clientId = networkIdentities[identityIndex].clientId;
        let participantRoundData = new dataClasses.ParticipantRoundData(id, clientId, [], []);
        participantRoundDataArr[id] = participantRoundData;
        netframe.log('Created participantRoundData: ' + JSON.stringify(participantRoundData));
    }

    let roundData = new dataClasses.RoundData(modelController.getGameManager().round, participantRoundDataArr);

    gameData.roundData.push(roundData);

    netframe.log('Created Round Data: ' + JSON.stringify(roundData));

    // notify clients
    netframe.makeRPC('startRound', [modelController.getGameManager().round]);


    netframe.getServer().send('updateRounds', modelController.getGameManager().round).toAdmin();
}

function initData(){
    netframe.log('initData() called on server');
    setAnswers();

    /*
    let participantDataArr = {};

    for(let identity in Object.values(netframe.getNetworkIdentities)){
        let participantData = new dataClasses.ParticipantData(identity.identityId, 0, 'male', 0);
        participantDataArr[identity.identityId] = participantData;
    }*/

    let moneyGroups = modelController.getGameManager().moneyGroups.map(moneyGroup => moneyGroup.value);
    gameData = new dataClasses.GameData(db.uniformAnswers, db.distributedAnswers, db.gameSettings.maxPlayers, db.gameSettings.maxRounds, db.gameSettings.gameMode, [], db.participants, moneyGroups);
    netframe.log('Created GameData: ' + JSON.stringify(gameData));
}

function createGameManager(){
    let manager = modelController.createGameManager(netframe.createNewEntityId());
    manager.numberOfPlayers = db.gameSettings.maxPlayers;
    manager.maxRounds = db.gameSettings.maxRounds;
    manager.gameMode = db.gameSettings.gameMode;
}

//only used to created answer as a one-time thing as the answer should be consistent across multiple experiments.
function createDistributedAnswers(){
    let deck = [];
    
    //fill deck
    let distribution = modelController.getGameManager().DISTRUBUTION;
    for (let colorKey in distribution){
        let amount = distribution[colorKey];

        for(let i = 0; i < amount; i++){
            deck.push(colorKey);
        }
    }
    netframe.log('Logging (non-shuffled) deck:\n' + deck);

    //shuffle it
    shuffle(deck);
    db.distributedAnswers = deck.slice(0);
    netframe.log('Logging (shuffled) deck:\n' + deck.join('\","'));

}

function createUniformAnswers(){
    let deck = [];

    //fill deck
    let colors = modelController.getGameManager().COLORS;
    for (let colorKey in colors){
        for(let i = 0; i < 10; i++){
            deck.push(colorKey);
        }
    }
    netframe.log('Logging (non-shuffled) deck:\n' + deck.join('\","'));

    //shuffle it
    shuffle(deck);
    db.uniformAnswers = deck.slice(0);
    netframe.log('Logging (shuffled) deck:\n' + deck.join('\","'));

}

function changeAnswerMode(mode){
    modelController.getGameManager().gameMode = mode;
    setAnswers();
}

function setNumberOfPlayers(amount){
    netframe.log('setNumberOfPlayers() called on serverController with: ' + Number(amount));
    netframe.makeRPC('setNumberOfPlayers', [amount]);
}

function setNumberOfRounds(amount){
    netframe.log('setNumberOfRounds() called on serverController with: ' + Number(amount));
    netframe.makeRPC('setNumberOfRounds', [amount]);
}

function setAnswers(){
    switch (modelController.getGameManager().gameMode) {
        case 'risky':
            answers = db.uniformAnswers.slice(0);
            break;
        case 'distributed':
            answers = db.distributedAnswers.slice(0);
            break;
        default:
            netframe.log('ERROR setting answers because unknown mode!!');
            break;
    }

}

//http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html#more
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function createFixedCards(){
    netframe.log('createFixedCards() called on server-controller');
    let moneyGroups = [];

    let moneyValues = [1200,600,400,300];

    let cardGroupIdCounter = 1;

    for(let moneyGroupCounter = 1; moneyGroupCounter <= 4; moneyGroupCounter++) {
        let mg = modelController.createMoneyGroup(moneyGroupCounter, moneyValues[moneyGroupCounter - 1]);

        for(let bubbleCounter = 1; bubbleCounter <= 6; bubbleCounter++){
            let bubble = modelController.createBubble(cardGroupIdCounter++, mg.id);

            bubble.colors = bubbleCollection[moneyGroupCounter-1][bubbleCounter-1];
            netframe.log('Added colors: ' + JSON.stringify(bubble));

            mg.bubbles.push(bubble);
        }

        netframe.log('Created money group: ' + JSON.stringify(mg));
        moneyGroups.push(mg);
    }

    netframe.makeRPC('createCardSet', [moneyGroups]);
}

function createRandomCards(){
    let moneyGroups = [];

    let moneyValues = [1200,600,400,300];

    let cardGroupIdCounter = 1;

    //6 card groups in each money group - number of cards in card group increases by one for each money group up to 4.
    for(let moneyGroupCounter = 1; moneyGroupCounter <= 4; moneyGroupCounter++){
        let mg = modelController.createMoneyGroup(moneyGroupCounter, moneyValues[moneyGroupCounter-1]);
        moneyGroups.push(mg);

        //Put this outside because the inner loop can't have duplicated colors
        let colorPool = Object.keys(modelController.getGameManager().COLORS).slice(0);

        //make 6 card groups
        for(let bubbleCounter = 1; bubbleCounter <= 6; bubbleCounter++){
            netframe.log('Making new bubble. Current color pool:' + colorPool);

            let cg = modelController.createBubble(cardGroupIdCounter++, mg.id);
            mg.bubbles.push(cg);

            //put X colors in a bubble, where X = moneyGroupCounter
            let remainingColors = makeXRandomColorInBubble(cg, moneyGroupCounter, colorPool.slice(0));
            netframe.log('Remaining colors after bubble creation: ' + remainingColors);
            netframe.log('Color pool after creation:' + colorPool);
            if(moneyGroupCounter === 1){
                colorPool = remainingColors;
            }
        }
    }

    netframe.makeRPC('createCardSet', [moneyGroups]);
}

function makeXRandomColorInBubble(bubble, amount, bubblePool){

    netframe.log('makeXRandomColorInBubbleI() - Bubble colors: ' + bubblePool);

    for(let i = 0; i < amount; i++){
        let randomColorIndex = getRandomInt(0, bubblePool.length);
        netframe.log('Picked random color index: ' + randomColorIndex);

        let randomColor = bubblePool[randomColorIndex];

        //remove it so we don't have duplicates
        bubblePool.splice(randomColorIndex, 1);

        netframe.log('Making card with color: ' + randomColor);
        bubble.colors.push(randomColor);
    }

    return bubblePool;

    /*
    for(let i = 0; i < amount; i++){
        let randomColorIndex = getRandomInt(0,Object.keys(COLORS).length);
        netframe.log('Picked random color index: ' + randomColorIndex);
        let randomColor = Object.keys(COLORS)[randomColorIndex];
        netframe.log('Making card with color: ' + randomColor);
        bubble.colors.push(randomColor);
    }
    */
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function saveToDisk(json){
    netframe.log('Saving JSON data to file...');

    fs.writeFile('myTestFile.json', json, 'utf8', finishedSaving);

    netframe.getServer().send('resJSON', json).toAdmin();
}

function finishedSaving(){
    netframe.log('Finished saving data to file!');
}

function gameOver(){
    netframe.log('gameOver() called on server');
    netframe.makeRPC('loadFinalScene', []);

    saveToDisk(JSON.stringify(gameData));
}

function reset(){
    netframe.makeRPC('reset', []);
}

//---------------------------------------------------------------

// Server-controller interface - should in most cases contain init(), clientConnected() and Commands{}.
const api = {
    init: init,
    reset: reset,
    changeAnswerMode: changeAnswerMode,
    setNumberOfPlayers: setNumberOfPlayers,
    setNumberOfRounds: setNumberOfRounds,
    commands: commands
};

export default api;
