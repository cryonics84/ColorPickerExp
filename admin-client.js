/* globals $ */
import createClient from 'monsterr'

import html from './src/admin-client.html'
import './src/admin-client.css'
import {gameSettings} from "./src/stages/sharedDB";

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
    'resJSON': (admin, json) => {
        download(json, 'json.txt', 'text/plain');
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

init();

//----------------------------

let hasStarted = false;

function init(){
    if(!hasStarted){
        $('#button-reset').hide();
    }else{
        $('##admin-button-startRisky').hide();
        $('#admin-button-startDistributed').hide();
        $('#options').hide();
    }

}

function resetGame(){
    //RESET
    admin.sendCommand('resetClient');
    $('#button-reset').hide();


    setTimeout(function(){
        admin.sendCommand('reset');
        hasStarted = false;
        $('#playersId').text('Connected players: Waiting for game to start...');
        $('#roundId').text('Current round: Waiting for game to start');

        $('#options').show();
    }, 500);
}

function startGame(){
    //START
    hasStarted = true;
    $('#button-reset').show();
    $('#options').hide();


    let maxPlayers = document.getElementById("numberOfPlayers").value;
    let maxRounds = document.getElementById("numberOfRounds").value;
    let gameMode = document.querySelector('input[name=gameMode]:checked').value;

    let gameSettings = {
        maxPlayers: maxPlayers,
        maxRounds: maxRounds,
        gameMode: gameMode
    };

    console.log('Starting game with options: ' + JSON.stringify(gameSettings));

    admin.sendCommand('start');
    admin.sendCommand('setGameSettings', [maxPlayers, maxRounds, gameMode]);

}

function updateRounds(number){
    $('#roundId').text('Current round: ' + number);
}

function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


