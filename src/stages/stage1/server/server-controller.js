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

    let identity = netframe.getNetworkIdentityFromClientId(clientId);

    let playerIndex;

    if(!db.gameSettings.networkMode){
        playerIndex = identity.identityId;
    }else{
        playerIndex = 0;
    }

    let colorAnswer = answers[modelController.getGameManager().round[playerIndex]-1];
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


    let bubbleSceneData = new dataClasses.BubbleSceneData(bubble.colors, moneyGroup.value, money, mouseData);
    netframe.log('Created BubbleSceneData: ' + JSON.stringify(bubbleSceneData));
    netframe.log('Applying round data. Current round data: ' + JSON.stringify(gameData.roundData));
    netframe.log('Logging GameManager: ' + JSON.stringify(modelController.getGameManager()));
    netframe.log('Rounds in GameManager: ' + modelController.getGameManager().round + '. Client IdentityID: ' + identity.identityId);


    let round = modelController.getGameManager().round[playerIndex] - 1;
    netframe.log('Round: ' + round + ', for player id index: ' + playerIndex);
    gameData.roundData[round].participantRoundData[identity.identityId].bubbleSceneData.push(bubbleSceneData);

    netframe.log('Saved game data: ' + JSON.stringify(gameData));


    if(!db.gameSettings.networkMode){
        //if we are in single player then we skip social scene and continue next round

        if(modelController.getGameManager().round[identity.identityId] >= modelController.getGameManager().maxRounds) {
            setTimeout(
                function () {
                    gameOver(true, clientId);
                }, 3000);
        }else{
            // Transition to new round (bubble scene)
            setTimeout(
                function() {
                    startRound(clientId);

                }, 4000);
        }

        return;
    }else{
        //If we are in multiplayer mode then we need to wait for other players and transition to social scene
    }

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
        if(modelController.getGameManager().round[0] >= modelController.getGameManager().maxRounds) {
            setTimeout(
                function () {
                    gameOver(true);
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

    let playerIndex;

    if(!db.gameSettings.networkMode){
        playerIndex = identity.identityId;
    }else{
        playerIndex = 0;
    }

    netframe.makeRPC('selectedParticipant',[clientId, selectedParticipantsId]);

    // Save data
    let socialSceneData = new dataClasses.SocialSceneData(identity.popularityFactor, selectedParticipantsId, mouseData);
    gameData.roundData[modelController.getGameManager().round[playerIndex]-1].participantRoundData[identity.identityId].socialSceneData.push(socialSceneData);

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

function cmdFinishedGame(canvasSize, clientId){
    netframe.log('cmdFinishedGame() called with: ' + JSON.stringify(arguments));
    //Find participant
    let participant = db.participants.find(participant => participant.id === clientId);
    participant.resolution = canvasSize;

    let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
    networkIdentity.isReady = true;

    //Check if everyone has finished
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
        //Everyone has finished the game
        netframe.getServer().send('GameOver').toAdmin();
    }
}

const commands = {
    'cmdSelectBubble': cmdSelectBubble,
    'cmdSelectParticipant': cmdSelectParticipant,
    'cmdFinishedGame': cmdFinishedGame
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

    initData();



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

function startRound(clientId){
    netframe.log('Starting round...');

    //If passed clientId then only start round for that client, else for everyone
    if(!db.gameSettings.networkMode){

        if(clientId){
            netframe.log('Starting solo round for client: ' + clientId);
            let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
            let id = networkIdentity.identityId;
            modelController.getGameManager().round[id]++;

            // notify clients
            netframe.makeRPC('startRound', [id, modelController.getGameManager().round[id]]);
        }else{
            let networkIdentities = Object.values(netframe.getNetworkIdentities());
            netframe.log('Starting solo round for all clients: ' + networkIdentities);

            for(let identityIndex in networkIdentities){
                let networkIdentity = networkIdentities[identityIndex];
                let id = networkIdentity.identityId;
                modelController.getGameManager().round[id]++;

                // notify clients
                netframe.log('Sending startRound RPC for client: ' + networkIdentity.clientId);
                netframe.makeRPC('startRound', [id, modelController.getGameManager().round[id]], networkIdentity.clientId);
            }
        }
    }else{
        netframe.log('Starting multi player round for all clients...');
        modelController.getGameManager().round[0] = modelController.getGameManager().round[0] + 1;

        // notify clients
        netframe.makeRPC('startRound', [0, modelController.getGameManager().round[0]]);
    }

    netframe.getServer().send('updateRounds', modelController.getGameManager().round[0]).toAdmin();
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

    gameData = new dataClasses.GameData(db.uniformAnswers, db.distributedAnswers, db.gameSettings.maxPlayers, db.gameSettings.maxRounds, db.gameSettings.gameMode, [], null);
    netframe.log('Created GameData: ' + JSON.stringify(gameData));

    createGameManager();

    let moneyGroups = modelController.getGameManager().moneyGroups.map(moneyGroup => moneyGroup.value);
    netframe.log('Adding money groups to gameData: ' + moneyGroups);
    gameData.moneyGroups = moneyGroups;

}

function createGameManager(){
    let manager = modelController.createGameManager(netframe.createNewEntityId());

    let players = netframe.getServer().getPlayers();
    netframe.log('Setting round of each networkIdentity. Number of Identities: ' + players.length);

    for(let playerIndex in players){
        netframe.log('Setting round of player: ' + players[playerIndex]);
        manager.round[playerIndex] = 0;
    }

    netframe.log('Created GameManager: ' + JSON.stringify(manager));

    netframe.log('Creating Round Data...');
    for(let round = 0; round < db.gameSettings.maxRounds; round++){
        let roundData = new dataClasses.RoundData(round);
        roundData.round = round;

        netframe.log('Creating participantRoundData for round: ' + round);
        for(let playerIndex in players){
            netframe.log('Creating participantRoundData for: ' + players[playerIndex] + ', with index: ' + playerIndex);
            let participantRoundData = new dataClasses.ParticipantRoundData(playerIndex, players[playerIndex], [], []);
            roundData.participantRoundData.push(participantRoundData);
            netframe.log('Created ParticipantRoundData: ' + JSON.stringify(participantRoundData));
        }

        netframe.log('Pushing RoundData: ' + JSON.stringify(roundData) +'\n on to gameData obj: ' + JSON.stringify(gameData));
        gameData.roundData.push(roundData);

        netframe.log('Created Round Data: ' + JSON.stringify(roundData))
    }

    manager.numberOfPlayers = db.gameSettings.maxPlayers;
    manager.maxRounds = db.gameSettings.maxRounds;
    manager.gameMode = db.gameSettings.gameMode;
    createFixedCards();
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

function saveToDisk(gameDataJSON){
    netframe.log('Saving JSON data to file...');

    fs.writeFile('myTestFile.json', gameDataJSON, 'utf8', finishedSaving);

    //netframe.getServer().send('resJSON', gameDataJSON).toAdmin();
}

function sendParticipantData(){
    netframe.getServer().send('resParticipantData', JSON.stringify(db.participants)).toAdmin();
}

function sendGameData(){
    fs.readFile('myTestFile.json', function read(err, data) {
        if (err) {
            throw err;
        }

        netframe.getServer().send('resGameData', data).toAdmin();
    });
}

function finishedSaving(){
    netframe.log('Finished saving data to file!');
}

function gameOver(isFinished, clientId){
    netframe.log('gameOver() called on server');

    if(clientId){
        netframe.makeRPC('loadFinalScene', [], clientId);
    }else{
        netframe.makeRPC('loadFinalScene', []);
    }

    if(isFinished){
        saveToDisk(JSON.stringify(gameData));
    }


}

function reset(){
    db.participants = [];

    netframe.makeRPC('reset', []);
}

//---------------------------------------------------------------

// Server-controller interface - should in most cases contain init(), clientConnected() and Commands{}.
const api = {
    init: init,
    reset: reset,
    sendGameData: sendGameData,
    sendParticipantData: sendParticipantData,
    commands: commands
};

export default api;
