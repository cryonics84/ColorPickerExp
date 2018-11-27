/* globals $ */
import createClient from 'monsterr'

import html from './src/admin-client.html'
import './src/admin-client.css'
//import {gameSettings} from "./src/stages/sharedDB";
import * as db from "./src/stages/sharedDB";
import * as adminContent from './src/adminHTML.html'




let options = {
  canvasBackgroundColor: 'white',
  htmlContainerHeight: 1.0,
  // HTML is included in options for admin
  html
}

let events = {
    'clientConnected': function (admin, data) {
        console.log('Received clientConnected event from server with data: ' + JSON.stringify(data));
        updatePlayerList(data.clients);
    },
    'clientDisconnected': function (admin, data) {
        console.log('Received clientDisconnected event from server with data: ' + JSON.stringify(data));
        updatePlayerList(data.clients);
    },
    'resConnections': function (admin, data) {
        console.log('Received resConnections event from server with data: ' + JSON.stringify(data));
        updatePlayerList(data.clients);
    },
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
    },
    'GameOver': function (admin, data) {
        console.log('Received GameOver event from server with data: ' + JSON.stringify(data));
        gameOver();
    },
};
let commands = {};

const admin = createClient({
  events,
  commands,
  options
  // no need to add stages to admin
});


//----------------------------

let hasStarted = false;

insertHTML();

function insertHTML(){
    console.log('loading html');
    //$("#admin").load(adminContent);
    //document.getElementById("admin").innerHTML='<object type="text/html" data=""></object>';
    document.getElementById("admin").innerHTML = (adminContent);

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

    hideStuff();

    admin.sendCommand('getConnections');
}

function hideStuff(){
    console.log('hideStuff() called');
    if(!hasStarted){
        console.log('game has not started yet');
        $('#activeGame').hide();
        $('#gameSettings').show();
        $('#gameOver').hide();
    }else{
        console.log('game has started yet');
        $('#activeGame').show();
        $('#gameSettings').hide();
        $('#gameOver').hide();
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
    $('#gameOver').hide();


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
    let networkMode = gameSettings.networkMode.value;

    console.log('Starting ' + gameMode + ' game with maxRounds: ' + maxRounds);

    admin.sendCommand('start');
    admin.sendCommand('setGameSettings', [maxRounds, gameMode, networkMode]);

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

function updatePlayerList(clients){
    let ul = document.getElementById("playerList");

    ul.innerHTML = "";

    for(let clientIndex in clients){
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(clients[clientIndex]));
        ul.appendChild(li);
    }
}

function gameOver(){
    $('#gameOver').show();


}

