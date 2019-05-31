import model from '../shared/model/model';
import modelController from '../shared/controller/controller';
import {hasMixin} from '../lib/mixwith';
import {serverSharedInterface as netframe} from '../lib/netframe';
import bubbleCollection from './bubbles';
import * as dataClasses from '../shared/model/data';
import * as db from '../../sharedDB';
import { NetworkStates } from '../lib/entity';
import { Network } from 'monsterr';

let fs = require('fs');
// ---------------------------------------------------------------
// Variables
// ---------------------------------------------------------------

let answers = [];
let gameData;

//---------------------------------------------------------------
// Commands
//---------------------------------------------------------------

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------

function cmdSelectBubble (bubbleIdGuess, clientId, mouseData) {
	netframe.log('called cmdSelectBubble() on server with bubble id: ' + bubbleIdGuess + ', and networkIdentity: ' + clientId);

	let identity = netframe.getNetworkIdentityFromClientId(clientId);
	let playerIndex;

	if(!db.gameSettings.networkMode){
		playerIndex = identity.identityId;
	}else{
		playerIndex = 0;
	}

	let bubble = modelController.getCardGroupById(bubbleIdGuess);
	netframe.log('Found bubble: ' + JSON.stringify(bubble));

	let moneyGroupId = bubble.moneyGroupId;
	netframe.log('moneyGroupId: ' + moneyGroupId);

	let moneyGroup = modelController.getGameManager().moneyGroups[moneyGroupId - 1];
	netframe.log('Found moneyGroup: ' + JSON.stringify(moneyGroup));
	
	let round = modelController.getGameManager().round[playerIndex]-1;
	netframe.log('Found round: ' + round);

	let colorAnswer = answers[round];
	netframe.log('Found colorAnswer: ' + colorAnswer);

	let money = 0;
	//did user guess correct?
	if(bubble.colors.includes(colorAnswer)){
		money = moneyGroup.value;
		netframe.log('User guessed correct!');
	}else{
		netframe.log('User guessed wrong!');
		money = -moneyGroup.value;
	}

	identity.scores[round] = money;
	identity.lastScore = money;
	identity.selectedBubble = bubble;

	//Save data
	netframe.log('Saving bubble data...');

	let bubbleSceneData = new dataClasses.BubbleSceneData(bubble.colors, moneyGroup.value, money, mouseData);
	netframe.log('Created BubbleSceneData: ' + JSON.stringify(bubbleSceneData));
	netframe.log('Applying round data. Current round data: ' + JSON.stringify(gameData.roundData));
	netframe.log('Logging GameManager: ' + JSON.stringify(modelController.getGameManager()));
	netframe.log('Rounds in GameManager: ' + modelController.getGameManager().round + '. Client IdentityID: ' + identity.identityId);

	netframe.log('Round: ' + round + ', for player id index: ' + playerIndex);
	gameData.roundData[round].participantRoundData[identity.identityId].bubbleSceneData.push(bubbleSceneData);

	netframe.log('Saved game data: ' + JSON.stringify(gameData));

	let stateData = {
		'selectedBubble' : bubble,
		'money' : money,
	}
	
	setStateOfNetworkIdentity(identity, NetworkStates.CERTAINTY, stateData);

}

function cmdContinueFromRewardScene(clientId){
	netframe.log('cmdContinueFromRewardScene() was called');
	

	netframe.log('is networkmode: ' + db.gameSettings.networkMode );

	if(db.gameSettings.networkMode){
		
		let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
		networkIdentity.isReady = true;

		if(isAllReady()){
			if(modelController.getGameManager().round[0] >= modelController.getGameManager().maxRounds) {
				setTimeout(
					function () {
						gameOver(true);
					}, 1000);
			}else{
				netframe.log('Transition to social scene');

				let networkIdentities = netframe.getNetworkIdentities();

				//Send to clients
				for(let i in networkIdentities){

					networkIdentity = networkIdentities[i];
					networkIdentity.isReady = false;

					let networkIdentitiesData = [];
	
					let visibleNetworkIdentities = modelController.getGameManager().getVisibleNetworkIdentitiesOfClientId(networkIdentity.clientId);

	
					//Create struct
					for(let i in visibleNetworkIdentities){
						
						let data = {
							'identityId' : visibleNetworkIdentities[i].identityId,
							'clientId' : visibleNetworkIdentities[i].clientId,
							'lastScore' : visibleNetworkIdentities[i].lastScore,
							'selectedBubble' : visibleNetworkIdentities[i].selectedBubble
						};

						networkIdentitiesData.push(data);
						networkIdentitiesData.push(data);
						networkIdentitiesData.push(data);
						networkIdentitiesData.push(data);
						networkIdentitiesData.push(data);
						
					}
	
					let stateData = {
						'networkIdentitiesData' : networkIdentitiesData
					}

					setStateOfNetworkIdentity(networkIdentity, NetworkStates.SOCIAL, stateData);
				}
			}
		}else{
			netframe.log('not everyone is ready yet');
			let stateData = {};
			setStateOfNetworkIdentity(networkIdentity, NetworkStates.WAITINGFORSOCIAL, stateData);
		}
	}else{
		let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
		let round = modelController.getGameManager().round[networkIdentity.identityId];
		let maxRounds =  modelController.getGameManager().maxRounds;
		if(round >= maxRounds) {
			netframe.log('Current round: ' + round + ', max rounds reached for client: ' + clientId + ', with ID: ' + networkIdentity.identityId);
			gameOver(true, clientId);
	
		}
		else
		{
			// Transition to new round (bubble scene)
			netframe.log('Current round: ' + round + ', for client ' + clientId + ', with ID: ' + networkIdentity.identityId + ' - maxRounds: ' + maxRounds + '\nGoing to next round');
			startRound(clientId);
		}
	}

	
}

function cmdSelectParticipant(clientId, selectedParticipants, mouseData){
	let identity = netframe.getNetworkIdentityFromClientId(clientId);
	let round = modelController.getGameManager().round[0]-1;

	modelController.selectedParticipant(identity, round, selectedParticipants);

	let selectedParticipantsId = [];
	for(let i in selectedParticipantsId){
		selectedParticipantsId.push(selectedParticipantsId[i].identityId);
	}

	// Save data
	let socialSceneData = new dataClasses.SocialSceneData(identity.popularityFactor, selectedParticipantsId, mouseData);
	gameData.roundData[modelController.getGameManager().round[0]-1].participantRoundData[identity.identityId].socialSceneData.push(socialSceneData);

	let hasFinished = modelController.hasEveryoneFinishedSocial (round);
	netframe.log('EveryoneHasFinishedSocial: ' + hasFinished);
	if(hasFinished){
		startRound();
    }

}

function cmdFinishedGame(canvasSize, clientId){
	netframe.log('cmdFinishedGame() called with: ' + JSON.stringify(arguments));
	//Find participant
	let participant = db.participants.find(participant => participant.id === clientId);
	participant.resolution = canvasSize;

	let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
	networkIdentity.isReady = true;

	if(isAllReady()){
		netframe.getServer().send('GameOver').toAdmin();
	}
}

function cmdRequestState(clientId){
	netframe.log('cmdRequestState() was called with clientId: ' + clientId);
	let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
	if(networkIdentity){
		sendCurrentNetworkIdentityState();
	}else{

		let stateObj = {
			'state': NetworkStates.LOGIN,
			'stateData' : {}
		};
		
		netframe.makeRPC('updateState', [stateObj], clientId);
	}
	
}

function cmdSelectedCertainty(clientId, certainty){
	let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
	
	setStateOfNetworkIdentity(networkIdentity, NetworkStates.REWARD, networkIdentity.stateData);
}

/*
function cmdLogin(clientId, password){
	netframe.log('cmdLogin() called with clientId: ' + clientId + ', password: ' + password);

	let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
	networkIdentity.password = password;

	netframe.log('Logged in users: ' + JSON.stringify(netframe.getLoggedInUsers()));
	
	let clients = [];
	
	let loggedInNetworkIdentities = netframe.getLoggedInUsers();
	for(let key in loggedInNetworkIdentities){
		clients.push(loggedInNetworkIdentities[key].clientId);
	}

	let msg = {
		clients : clients
	}

	netframe.getServer().send('clientLogin', msg).toAdmin();

	let stateData = {
		
	}
	setStateOfNetworkIdentity(networkIdentity, NetworkStates.LOBBY, stateData);

	StartGameIfReady();

	
}
*/

const commands = {
	'cmdSelectBubble': cmdSelectBubble,
	'cmdSelectParticipant': cmdSelectParticipant,
	'cmdFinishedGame': cmdFinishedGame,
	'cmdRequestState': cmdRequestState,
	'cmdContinueFromRewardScene' : cmdContinueFromRewardScene,
	'cmdSelectedCertainty' : cmdSelectedCertainty
};

function init(serverInstance){

	//initiate NetFrame (always do first)
	netframe.init(serverInstance); // initialize NetFrame and set server reference

	//initiate modelController
	modelController.init();

	// Setup
	netframe.shouldLog(true); // stop logging
	netframe.addUpdateCallback(update); // add update callback
	netframe.addClientConnectedCallback(clientConnected); // add client connected callback
	netframe.addClientLoggedInCallback(clientLoggedIn)
	netframe.startLoop(10); // start server update with X ms interval - stop again with stopLoop()

	initData();



	//createUniformAnswers();
	//createDistributedAnswers();
}

// Gets called from netframe after each update
function update(){}

// Gets called from netframe when a client has joined a stage
function clientConnected(client){
	netframe.log('clientConnected() callback called on server-controller with clientId: ' + client + ', and networkworkId: ' + JSON.stringify(networkIdentity));

	// make initial state for client
	//let stateObj = createInitState(networkIdentity);
	//setStateOfNetworkIdentity(networkIdentity, stateObj.state, stateObj.stateData, false);

}

function clientLoggedIn(networkIdentity, password){
	netframe.log('clientLoggedIn() called with networkIdentity: ' + JSON.stringify(networkIdentity) + ', password: ' + password);

	netframe.log('Logged in users: ' + JSON.stringify(netframe.getLoggedInUsers()));
	
	let clients = [];
	
	let loggedInNetworkIdentities = netframe.getLoggedInUsers();
	for(let key in loggedInNetworkIdentities){
		clients.push(loggedInNetworkIdentities[key].clientId);
	}

	let msg = {
		clients : clients
	}

	netframe.getServer().send('clientLogin', msg).toAdmin();

	let stateData = {
		
	}
	setStateOfNetworkIdentity(networkIdentity, NetworkStates.LOBBY, stateData);

	StartGameIfReady();
}

function StartGameIfReady(){
	
	netframe.log('Checking if all players are ready... Max players are: ' + modelController.getGameManager().maxPlayers + ', current number of players: ' + netframe.getNetworkIdentitiesSize());

	if(modelController.getGameManager().gameState === modelController.getGameManager().GAMESTATES.WAITING){
		netframe.log('Game is in waiting mode..');
		
		if(netframe.getLoggedInUsersSize() === modelController.getGameManager().maxPlayers){
			netframe.log('Game is starting soon...');

			modelController.getGameManager().gameState = modelController.getGameManager().GAMESTATES.PLAYING;

			setTimeout(startRound, 2000);

			
		}else{
			netframe.log('Not all players are here yet...');
			netframe.log('Size type: ' + typeof netframe.getLoggedInUsersSize());
			netframe.log('maxPlayers type: ' + typeof modelController.getGameManager().maxPlayers);
		}
	}else{
		netframe.log('Game is NOT in waiting mode..');
	}
}

//---------------------------------------------------------------
// Controller functions
//---------------------------------------------------------------

function isAllReady(){
	let allReady = true;
	netframe.log('Checking if all participants are ready...');
	let networkIdentities =  Object.values(netframe.getNetworkIdentities());
	for(let i in networkIdentities){
		if(!networkIdentities[i].isReady){
			allReady = false;
			break;
		}
	}

	return allReady;
}

function createInitState(networkIdentity){

	let round = db.gameSettings.networkMode ? 0 : networkIdentity.identityId;

	let stateObj = {
		'state': NetworkStates.LOGIN,
		'stateData' : {
			'round' : round,
			'maxRounds' : modelController.getGameManager().maxRounds,
			'numberOfPlayers' : netframe.getNetworkIdentitiesSize(),
			'maxPlayers' : modelController.getGameManager().maxPlayers
		}
	};
	
	return stateObj;
}

function setStateOfNetworkIdentity(networkIdentity, state, stateData, shouldSendState = true){

	networkIdentity.state = state;
	networkIdentity.stateData = stateData;

	netframe.log('test...\n' + JSON.stringify(netframe.getNetworkIdentities()));

	if(shouldSendState){
		sendCurrentNetworkIdentityState(networkIdentity);
	}
}

function sendCurrentNetworkIdentityState(networkIdentity){

    let stateObj = {
		'state': networkIdentity.state,
		'stateData' : networkIdentity.stateData
	};
	
	netframe.makeRPC('updateState', [stateObj], networkIdentity.clientId);

	/*
	switch (state){
	case NetworkStates.LOBBY:
		break;
	case NetworkStates.BUBBLE:
		stateData = getBubbleState();
		break;
	case NetworkStates.REWARD:
        stateData = getBubbleState();
		break;
	case NetworkStates.CERTAINTY:
        stateData = getBubbleState();
		break;
	case NetworkStates.SOCIAL:
        stateData = getBubbleState();
		break;
	case NetworkStates.FINISHED:
        stateData = getBubbleState();
		break;
	case NetworkStates.READYBUBBLE:
		stateData = getBubbleState();
	}
*/

}

function startRound(clientId){
	netframe.log('Starting round...');

	saveToDisk(JSON.stringify(gameData));
	saveToDiskParticipants(JSON.stringify(db.participants));

	//If passed clientId then only start round for that client, else for everyone
	if(!db.gameSettings.networkMode){
		netframe.log('Single mode');

		if(clientId){
			netframe.log('Starting solo round for client: ' + clientId);
			let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
			let id = networkIdentity.identityId;
			modelController.getGameManager().round[id] = modelController.getGameManager().round[id] + 1;
			_startIndiviualRound(networkIdentity, modelController.getGameManager().round[id]);

			/*
            modelController.getGameManager().round[id]++;

            // notify client
            netframe.makeRPC('startRound', [id, modelController.getGameManager().round[id]], clientId);

            netframe.getServer().send('updateRounds', modelController.getGameManager().round).toAdmin();
            */

			if(networkIdentity.hasHint){
				netframe.makeRPC('addHint', [], networkIdentity.clientId);
			}
            
		}else{
			let networkIdentities = Object.values(netframe.getNetworkIdentities());
			netframe.log('Starting solo round for all clients: ' + networkIdentities);

			for(let identityIndex in networkIdentities){
				let networkIdentity = networkIdentities[identityIndex];
				let id = networkIdentity.identityId;
				modelController.getGameManager().round[id] = modelController.getGameManager().round[id] + 1;
				_startIndiviualRound(networkIdentity, modelController.getGameManager().round[id]);

				/*
                modelController.getGameManager().round[id]++;
                // notify clients
                netframe.log('Sending startRound RPC for client: ' + networkIdentity.clientId);
                netframe.makeRPC('startRound', [id, modelController.getGameManager().round[id]], networkIdentity.clientId);
                */

				if(networkIdentity.hasHint){
					netframe.makeRPC('addHint', [], networkIdentity.clientId);
				}

			}
		}
	}else{
		netframe.log('Starting multi player round for all clients...');

		modelController.getGameManager().round[0] = modelController.getGameManager().round[0] + 1;

		let networkIdentities = netframe.getNetworkIdentities()
		for(let identityIndex in networkIdentities){
			let networkIdentity = networkIdentities[identityIndex];
			
			_startIndiviualRound(networkIdentity, 0);
		}
		

		//modelController.getGameManager().round[0] = modelController.getGameManager().round[0] + 1;
		//netframe.makeRPC('startRound', [0, modelController.getGameManager().round[0]]);
		//netframe.getServer().send('updateRounds', modelController.getGameManager().round[0]).toAdmin();
	}

	netframe.getServer().send('updateRounds', modelController.getGameManager().round).toAdmin();
}

function _startIndiviualRound(networkIdentity, round){
	//Increase round

	//Send RPC
	//netframe.makeRPC('startRound', [identityId, modelController.getGameManager().round[identityId]], clientId);
	
	let stateData = {
		'moneyGroups': modelController.getGameManager().moneyGroups,
		'round' : round,
		'maxRounds' : modelController.getGameManager().maxRounds
	};
	setStateOfNetworkIdentity(networkIdentity, NetworkStates.BUBBLE, stateData);
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
	let manager = modelController.createGameManager();

	let players = netframe.getServer().getPlayers();
	netframe.log('Setting round of each networkIdentity. Number of Identities: ' + players.length);

	for(let playerIndex in players){
		netframe.log('Setting round of player: ' + players[playerIndex]);
		manager.round[playerIndex] = 0;
	}

	

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

		netframe.log('Created Round Data: ' + JSON.stringify(roundData));
	}

	manager.maxPlayers = db.gameSettings.maxPlayers;
	manager.maxRounds = db.gameSettings.maxRounds;
	manager.gameMode = db.gameSettings.gameMode;
	manager.crossTableClientData = db.gameSettings.crossTableClientData;

	netframe.log('Created GameManager: ' + JSON.stringify(manager));

	

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

	//shuffle it
	shuffle(deck);
	db.uniformAnswers = deck.slice(0);
}

function changeAnswerMode(mode){
	modelController.getGameManager().gameMode = mode;
	setAnswers();
}

function setMaxPlayers(amount){
	netframe.log('setNumberOfPlayers() called on serverController with: ' + Number(amount));
	//netframe.makeRPC('setNumberOfPlayers', [amount]);
	modelController.setMaxPlayers(amount);
}

function setNumberOfRounds(amount){
	netframe.log('setNumberOfRounds() called on serverController with: ' + Number(amount));
	//netframe.makeRPC('setNumberOfRounds', [amount]);
	modelController.setNumberOfRounds(amount);
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
			//netframe.log('Added colors: ' + JSON.stringify(bubble));

			mg.bubbles.push(bubble);
		}

		//netframe.log('Created money group: ' + JSON.stringify(mg));
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

	fs.writeFile('gameData.json', gameDataJSON, 'utf8', finishedSaving);

	//netframe.getServer().send('resJSON', gameDataJSON).toAdmin();
}

function saveToDiskParticipants(participantDataJSON){
	netframe.log('Saving JSON data to file...');

	fs.writeFile('participantData.json', participantDataJSON, 'utf8', finishedSaving);

	//netframe.getServer().send('resJSON', gameDataJSON).toAdmin();
}

function sendParticipantData(){
	netframe.log('sendParticipantData() called on servercontroller...');
	netframe.getServer().send('resParticipantData', JSON.stringify(db.participants)).toAdmin();
}

function sendGameData(){
	netframe.log('sendGameData() called on servercontroller...');
	fs.readFile('gameData.json', function read(err, data) {
		if (err) {
			netframe.log('Error!!');
			throw err;
		}

		netframe.log('sending data: ' + JSON.stringify(gameData));
		netframe.getServer().send('resGameData', data).toAdmin();
	});
}

function finishedSaving(){
	netframe.log('Finished saving data to file!');
}

function calculateFinalScore(networkIdentity){
	netframe.log('Calculating scores...');

	netframe.log('Client: ' + networkIdentity.clientId + ', has scores: ' + networkIdentity.scores);
	let multiplier = modelController.getGameManager().scoreMultiplier;
	let numberOfRandomScores = modelController.getGameManager().numberOfRandomScores;
	let randomScores = getMeRandomElements(networkIdentity.scores, numberOfRandomScores);

	let finalScore = 0;
	for(let i = 0; i < numberOfRandomScores; i++){
		finalScore += randomScores[i] * multiplier;
	}
	// FIXME: This is a kludge to get the right amount
	finalScore += 110;

	netframe.log('Finished calculating final scores: ' + finalScore);
	return finalScore;
}

function getMeRandomElements(sourceArray, neededElements) {
	let result = [];
	let tempArr = sourceArray.slice(0);

	for (let i = 0; i < neededElements; i++) {
		let randomIndex = Math.floor(Math.random()*tempArr.length);
		result.push(sourceArray[randomIndex]);
		//Remove it so we don't get duplicates
		tempArr.splice(randomIndex, 1);
	}
	return result;
}

function gameOver(isFinished, clientId){
	netframe.log('gameOver() called on server');

	if(clientId){
		let networkIdentity = netframe.getNetworkIdentityFromClientId(clientId);
		let finalScore = calculateFinalScore(networkIdentity);
		networkIdentity.finalScore = finalScore;

		netframe.log('Saving client final score to gameData');
		//Save score to gameData
		gameData.finalScore.push({id: clientId, score: finalScore});

		//netframe.makeRPC('loadFinalScene', [finalScore], clientId);
		let stateData = {
			'finalScore' : finalScore
		}
		setStateOfNetworkIdentity(networkIdentity, NetworkStates.FINISHED, stateData);

	}else{
		let networkIdentities = Object.values(netframe.getNetworkIdentities());
		for (let ni in networkIdentities){
			let networkIdentity = networkIdentities[ni];
			let finalScore = calculateFinalScore(networkIdentity);
			networkIdentity.finalScore = finalScore;

			netframe.log('Saving client final score to gameData');
			//Save score to gameData
			gameData.finalScore.push({id: networkIdentity.clientId, score: finalScore});

			//netframe.makeRPC('loadFinalScene', [finalScore], networkIdentities[ni].clientId);
			let stateData = {
				'finalScore' : finalScore
			}
			setStateOfNetworkIdentity(networkIdentities[ni], NetworkStates.FINISHED, stateData);
		}
	}

	if(isFinished){
		saveToDisk(JSON.stringify(gameData));
		saveToDiskParticipants(JSON.stringify(db.participants));
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
