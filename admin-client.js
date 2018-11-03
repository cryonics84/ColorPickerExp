/* globals $ */
import createClient from 'monsterr'

import html from './src/admin-client.html'
import './src/admin-client.css'
import {gameSettings} from "./src/stages/sharedDB";
import * as db from "./dist/admin-client";

let options = {
  canvasBackgroundColor: 'white',
  htmlContainerHeight: 1.0,
  // HTML is included in options for admin
  html
}

let events = {
    'updateRounds': function (admin, data) {
        console.log('Received printEntities event from server with data: ' + JSON.stringify(data));
        updateRounds(data);
    },
    'resGameData': (admin, json) => {
        download(json, 'gameDataJSON.json', 'text/plain');
        /*
        let fileName = 'monsterr-modules_' + Date.now() + '.csv'
        let data = JSON.stringify(json);
        let url = window.URL.createObjectURL(new Blob([data], {type: 'text/json'}))
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        */
    },
    'resParticipantData': (admin, json) => {
        download(json, 'participantsDataJSON.json', 'text/plain');
        /*
        let fileName = 'monsterr-modules_' + Date.now() + '.csv'
        let data = JSON.stringify(json);
        let url = window.URL.createObjectURL(new Blob([data], {type: 'text/json'}))
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        */
    },
    'finishedRegistration': (admin, data) => {
        console.log('Received finishedRegistration from server...');
        admin.getChat().append('finished registration');
    }
};
let commands = {};

const admin = createClient({
  events,
  commands,
  options
  // no need to add stages to admin
});

// Button event handlers (if you need more you should probably put them in a separate file and import it here)
$('#startButton').mouseup(e => {
    e.preventDefault()
    startGame();
});

$('#button-reset').mouseup(e => {
    e.preventDefault()
    resetGame();
});

$('#button-gameData').mouseup(e => {
    e.preventDefault()
    requestGameData();
});

$('#button-participantData').mouseup(e => {
    e.preventDefault()
    requestParticipantData();
});



//----------------------------

let hasStarted = false;

function init(){
    console.log('initializing...');
    if(!hasStarted){
        console.log('game has not started yet');
        $('#activeGame').hide();
    }else{
        console.log('game has started yet');
        $('#activeGame').show();
        $('#gameSettings').hide();
    }

}

function requestParticipantData(){
    console.log('requesting participant data...');
    admin.sendCommand('reqParticipantData');
}

function requestGameData(){
    console.log('requesting game data...');
    admin.sendCommand('reqGameData');
}

function resetGame(){
    //RESET
    admin.sendCommand('resetClient');
    $('#activeGame').hide();


    setTimeout(function(){
        admin.sendCommand('reset');
        hasStarted = false;
        $('#playersId').text('Connected players: Waiting for game to start...');
        $('#roundId').text('Current round: Waiting for game to start');

        $('#gameSettings').show();
    }, 500);
}

function startGame(){
    //START
    hasStarted = true;
    $('#activeGame').show();
    $('#gameSettings').hide();

    let gameSettings = document.getElementById("gameSettings");

    let maxRounds = gameSettings.numberOfRounds.value;
    let gameMode = gameSettings.gameMode.value;

    console.log('Starting ' + gameMode + ' game with maxRounds: ' + maxRounds);

    admin.sendCommand('start');
    admin.sendCommand('setGameSettings', [maxRounds, gameMode]);

}

function updateRounds(number){
    $('#roundId').text('Current round: ' + number + ' of ' + db.gameSettings.maxRounds);
}

function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


