/* globals $ */
//let fs = require('fs');
import fs from 'fs';

import createClient from 'monsterr'

import html from './src/admin-client.html'
import './src/admin-client.css'
//import {gameSettings} from "./src/stages/sharedDB";
import * as db from "./src/stages/sharedDB";
import * as adminContent from './src/adminHTML.html';




let options = {
  canvasBackgroundColor: 'white',
  htmlContainerHeight: 1.0,
  // HTML is included in options for admin
  html
}

let events = {
    'clientConnected': function (admin, data) {
        console.log('Received clientConnected event from server with data: ' + JSON.stringify(data));
        //updatePlayerList(data.clients);
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
    'clientLogin': function (admin, data) {
        console.log('Received clientLogin event from server with data: ' + JSON.stringify(data));
        updatePlayerList(data.clients);
    },
    'resLoadConnections': function (admin, data) {
        console.log('Received resLoadConnections event from server with data: ' + JSON.stringify(data));
        loadConnectionsFromFile(data);
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
let maxRounds = 0;
let crossTable;
let crossTableAmount = 0;

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
        e.preventDefault();
        requestGameData();
    });

    $('#button-participantData').mouseup(e => {
        e.preventDefault();
        requestParticipantData();
    });

    $('#btnSettings').mouseup(e => {
        e.preventDefault();
        showSettings();
    });

    $('#btnConnections').mouseup(e => {
        e.preventDefault();
        showConnections();
    });

    $('#btnSaveConnections').mouseup(e => {
        e.preventDefault();
        writeConnectionsToFile();
    });

    $('#btnLoadConnections').mouseup(e => {
        e.preventDefault();
        getConnectionsFromServerFile();
    });

    hideStuff();

    //admin.sendCommand('getLoggedInUsers');

    console.log('making cross table');
    crossTableAmount = 10;
    createCrossTable(crossTableAmount);


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

    maxRounds = gameSettings.numberOfRounds.value;
    let gameMode = gameSettings.gameMode.value;
    let networkMode = gameSettings.networkMode.value;

    console.log('Starting ' + gameMode + ' game with maxRounds: ' + maxRounds);

    //admin.sendCommand('start');
    admin.sendCommand('setGameSettings', [maxRounds, gameMode, networkMode, getCrossTableClients().clientDataArr]);

    admin.sendCommand('startGame');

}

function updateRounds(roundArr){
    $('#roundId').text('Current rounds: ' + roundArr + ' of ' + maxRounds);
}

function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function updatePlayerList(clients){
    console.log('updatePlayerList() called with: ' + clients);
    let ul = document.getElementById("playerList");

    ul.innerHTML = "";

    for(let clientIndex in clients){
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(clients[clientIndex]));
        ul.appendChild(li);
    }

    //createCrossTable(clients);
}
/*
function updatePlayerList(clients){
    console.log('updatePlayerList() called with: ' + clients);
    let ul = document.getElementById("playerList");

    ul.innerHTML = "";

    for(let clientIndex in clients){
        let index = Number(clientIndex) +1;
        if(index < crossTableAmount){
            console.log('Putting client in crosstable..');
            appendClientToCrossTable(index, clients[clientIndex]);
        }
        else{
            console.log('Putting client in waiting list..');
            let li = document.createElement("li");
            li.appendChild(document.createTextNode(clients[clientIndex]));
            ul.appendChild(li);
        }
    }

    //createCrossTable(clients);
}
*/
function gameOver(){
    $('#gameOver').show();


}

function createCrossTable(amount){
    console.log('createCrossTable() called with clients: ' + amount);
    let crossTableContainer = document.getElementById("crossTableContainer");

    console.log('test1');

    //clear existing
    crossTableContainer.innerHTML = "";

    console.log('test2');

    crossTable = document.createElement("TABLE");

    let css = '';
    //css += 'position:absolute;'
    //css += 'top:300px;';
    //css += 'left:300px;';
    //css += 'width:100%;';
    //css += 'height:200px;';
    //css += '-moz-border-radius:100px;';
    css += 'border:1px  solid #ddd;';
    css += 'border-collapse: collapse;';
    //css += '-moz-box-shadow: 0px 0px 8px  #fff;';
    //css += 'display:none;';
    
    //crossTable.style.cssText = css;
    //crossTable.setAttribute('style', css);
    setStyle(crossTable, css);

    console.log('test3');

    crossTableContainer.append(crossTable);

    let cssText = 'padding: 10px;';

    let cssHeader = cssText + 'background-color:powderblue;';
    let cssIntersection = cssText + 'text-align: center;';
    let cssIntersectionColored = cssIntersection + 'background-color:#ffcc99;';

    let cssInvalid = 'background-color:grey;';

    console.log('Creating cross table..');
    //let clientLength = clients.length;
    let min = 0;
    for(let x = min; x <= amount; x++){

        var row = crossTable.insertRow();

        for(let y = min; y <= amount; y++)
        {
            let cell = row.insertCell();
            
            if(x === min){
                
                if(y === min){
                    //Center cell
                    cell.onmousedown = function(){
                        clickedCenterCell(event, cell, x, y)
                    };

                    cell.innerHTML = ('CENTER TEST');

                }else{
                    // Column titles
                    //cell.innerHTML = clients[y-1];
                    cell.innerHTML = y;
                    setStyle(cell, cssHeader);

                    cell.onmousedown = function(){
                        clickedClientColumn(event, cell, x, y)
                    };
                }
                
            }
            else
            {
                

                if(y === min){
                    //HEADER
                    //cell.innerHTML = clients[x-1];
                    cell.innerHTML = x;
                    setStyle(cell, cssHeader);

                    cell.onmousedown = function(){
                        clickedClientRow(event, cell, x, y)
                    };
                }
                else{
                    //Intersection cells

                    if(x === y) {
                        // same client cell - skip
                        setStyle(cell, cssInvalid);
                    }else{
                        cell.innerHTML = '';
                    
                        cell.onclick = function(){
                            clickedCell(cell, x, y)
                        };
    
                        // color every 2nd cell - (offset by every 2nd cross cell)
                        if((x + (y % 2 === 0)) % 2 === 0){
                            setStyle(cell, cssIntersectionColored);
                        }else{
                            setStyle(cell, cssIntersection);
                        }
                    }
                }
            }
        }
    }
    console.log('Finished creating crosstable');
}

function setRowContent(rowIndex, content){
    for (var i = 1, cell; cell = crossTable.rows[rowIndex].cells[i]; i++) {
        if(i === rowIndex) continue;
        cell.innerHTML = content;
    }
}

function setColumnContent(columnIndex, content){
    for (var i = 1, row; row = crossTable.rows[i]; i++) {
        if(i === columnIndex) continue;
        row.cells[columnIndex].innerHTML = content;
    }
}

function setAllCellsContent(content){
    for (var i = 1, row; row = crossTable.rows[i]; i++) {
        //iterate through rows

        for (var j = 1, cell; cell = row.cells[j]; j++) {
            if(i === j) continue;
            cell.innerHTML = content;
        }
    }
}


function appendClientToCrossTable(index, clientId){
    console.log('appendClientToCrossTable() called with index: ' + index + ', clientId: ' + clientId);
    console.log('crossTable.rows[0].cells length: ' + crossTable.rows[0].cells.length);

    crossTable.rows[0].cells[index].innerHTML = clientId;
    console.log('crossTable.rows length: ' + crossTable.rows.length);
    crossTable.rows[index].cells[0].innerHTML = clientId;
}

function clickedCell(cell, x, y){
    console.log('Clicked cell [' + x + ', ' + y + ']');

    if(cell.innerHTML == "x"){
        cell.innerHTML = "";
    }else{
        cell.innerHTML = "x";
    }
}

function clickedClientColumn(event,cell, x, y){
    console.log('Clicked client column cell [' + x + ', ' + y + ']');
    let content = 'x';
    if(event.altKey) {content = ''};
    setColumnContent(y, content);
}

function clickedClientRow(event, cell, x, y){
    console.log('Clicked client row cell [' + x + ', ' + y + ']');
    let content = 'x';
    if(event.altKey) {content = ''};
    setRowContent(x, content);
}

function clickedCenterCell(event, cell, x, y){
    console.log('Clicked clickedCenterCell [' + x + ', ' + y + ']');
    let content = 'x';
    if(event.altKey) {content = ''};
    setAllCellsContent(content);
}

function setStyle(element, style){
    element.setAttribute('style', style);
}

function setCrossTableClients(clientDataArr){
    console.log('setCrossTableClients() called');
    
    console.log('i length: ' + clientDataArr.length);

    for (let i = 0; i < clientDataArr.length; i++) {
        console.log('i: ' + i);
        for (let j = 0; j < clientDataArr[i].length; j++) {
            console.log('j: ' + j);
            console.log('content: ' + clientDataArr[i][j]); 
            
            let cell = Number(clientDataArr[i][j]);
            
            crossTable.rows[i+1].cells[cell].innerHTML = 'x';
        }
        
    }
    
}

function getCrossTableClients(){
    console.log('getCrossTableClients() called');

    let clientDataArr = [];

    for (var i = 1, clientColumnCell; clientColumnCell = crossTable.rows[0].cells[i]; i++) {
        //iterate through rows
        //console.log('Iterating i: ' + i + ', clientColumnCell: ' + clientColumnCell);

        //let client =  i;
        let visibleClients = [];
        
        for (var j = 1, visibleClientIndex; visibleClientIndex = crossTable.rows[i].cells[j]; j++) {
            //get visible clients from row
            //console.log('Iterating j: ' + j + ', visibleClientIndex: ' + visibleClientIndex);

            let isVisible = visibleClientIndex.innerHTML === 'x' ? true : false;
            
            if(isVisible){
                visibleClients.push(j);
            }
        }

        //let clientData = new ClientData(client, visibleClients)
        clientDataArr.push(visibleClients);
     }

     let crossTableClients = new CrossTableClients(clientDataArr);
     
     console.log('Created crossTableClients: ' + JSON.stringify(crossTableClients));

     return crossTableClients;
}

/*
function getCrossTableClients(){
    console.log('getCrossTableClients() called');

    let clientDataArr = [];

    for (var i = 1, clientColumnCell; clientColumnCell = crossTable.rows[0].cells[i]; i++) {
        //iterate through rows
        //console.log('Iterating i: ' + i + ', clientColumnCell: ' + clientColumnCell);

        let client =  clientColumnCell.innerHTML;
        let visibleClients = [];
        
        for (var j = 1, visibleClientIndex; visibleClientIndex = crossTable.rows[i].cells[j]; j++) {
            //get visible clients from row
            //console.log('Iterating j: ' + j + ', visibleClientIndex: ' + visibleClientIndex);

            let isVisible = visibleClientIndex.innerHTML === 'x' ? true : false;
            
            if(isVisible){
                let visibleClient =  crossTable.rows[0].cells[j].innerHTML;
                visibleClients.push(visibleClient);
            }
        }

        let clientData = new ClientData(client, visibleClients)
        clientDataArr.push(clientData);
        
     }

     let crossTableClients = new CrossTableClients(clientDataArr);
     
     console.log('Created crossTableClients: ' + JSON.stringify(crossTableClients));

     return crossTableClients;
}
*/

class ClientData
{
    constructor(client, visibleClients)
    {
        this.client = client;
        this.visibleClients = visibleClients;
    }
}

class CrossTableClients 
{
    constructor(clientDataArr)
    {
        this.clientDataArr = clientDataArr;
    }
}

function showSettings(){
    console.log("Show Settings...");
    $('#settingsTab').show();
    $('#connectionsTab').hide();
}

function showConnections(){
    console.log("Show Connections...");
    $('#settingsTab').hide();
    $('#connectionsTab').show();
}


function writeConnectionsToFile(){
    console.log('writeConnectionsToFile() called');
    let connections = getCrossTableClients();
    //let connectionsJSON = JSON.stringify(connections);
    console.log('Sending connections to server..');
    
    admin.sendCommand('reqSaveConnections', [connections]);
}


function loadConnectionsFromFile(connections){
    console.log("loadConnectionsFromFile() with connections: " + JSON.stringify(connections));
    setCrossTableClients(connections.clientDataArr);
}

function getConnectionsFromServerFile(){
    admin.sendCommand('reqLoadConnections');
}