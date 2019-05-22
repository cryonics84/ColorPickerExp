import modelController from '../shared/controller/controller'
import {clientSharedInterface as netframe} from '../lib/netframe'
import model from "../shared/model/model";
import clientController from './client-controller';
import emoji from './emoji.png';
import emojiSelected from './emojiSelected.png';
import speechBubble from './speechBubble3.png';
import * as dataClasses from '../shared/model/data';

let canvas;
let entityViewMap = new Map();
let playersTxt;

let colorBandArr = ['#cecece', '#b7b7b7', '#9b9999', '#898989'];

let spacingPercentage = 0.2;
let gapPercentage = 0.02;
let centerPoint = {};
let smallestScreenSize;
let strokeWidth;
let gapWidth;

let emojiImg, speechBubbleImg;

let mouseData = [];
let mouseTimer;
/*
let State = {Waiting: 0, Lobby: 1, Bubble: 2, Reward: 3, Avatar: 4, End: 5};
let currentState = State.Waiting;
*/

let canvasSize;

function init(){

    loadImages();

    entityViewMap = new Map();

    model.setCallbackMap(Iview);

    canvas = netframe.getClient().getCanvas();



    /*
    canvas.on("mouse:down", function (options) {
        if(options.target){
            if(options.target.id){
                clickedBubble(options.target.id);
            }
        }else{
            netframe.log('Mouse Data: ' + JSON.stringify(mouseData));
        }
    });
*/
    canvas.clear();

    //initTimer();

    setupWindowChange();
    calculateSizes();
}

let readyCircle;
let readyText;

function scaleCanvas(){
    var factorX = canvas.getWidth() / canvasSize.x;
    var factorY = canvas.getHeight() / canvasSize.y;

    _zoomCanvas(factorX, factorY);
}

function _zoomCanvas(factorX, factorY) {
    //canvas.setHeight(canvas.getHeight() * factorY);
    //canvas.setWidth(canvas.getWidth() * factorX);

    /*
    if (canvas.backgroundImage) {
        // Need to scale background images as well
        var bi = canvas.backgroundImage;
        bi.width = bi.width * factorX; bi.height = bi.height * factorY;
    }
    */

    var objects = canvas.getObjects();
    
    var tcounter = 0;
    
    for (var i in objects) {
        
        netframe.log('Scaling object: ' + JSON.stringify(objects[i]));

        tcounter++;

        //alert(tcounter);
        var scaleX = objects[i].scaleX;
        var scaleY = objects[i].scaleY;
        var left = objects[i].left;
        var top = objects[i].top;
    
        var tempScaleX = scaleX * factorX;
        var tempScaleY = scaleY * factorY;
        var tempLeft = left * factorX;
        var tempTop = top * factorY;
    
        /*
        objects[i].scaleX = tempScaleX;
        objects[i].scaleY = tempScaleY;
        objects[i].left = tempLeft;
        objects[i].top = tempTop;
    */

        objects[i].set('scaleX', tempScaleX);
        objects[i].set('scaleY', tempScaleY);
        objects[i].set('left', tempLeft);
        objects[i].set('top', tempTop);

        objects[i].setCoords();

        netframe.log('Result of scaling: ' + JSON.stringify(objects[i]));
    }
    canvas.renderAll();
    canvas.calcOffset();
}

function setReadyTextVisibility(isVisible, btnCallback){
    netframe.log('Setting ready group visibility: ' + isVisible);
    if(isVisible){
        let readyText = createText('Click center circle to begin...', {x: centerPoint.x, y: centerPoint.y -50, originX: 'center',
            originY: 'center'}, 'black', 50);
        let circleRadius = 10;

        //let readyCircle = createBandView(-1, centerPoint.x, centerPoint.y,circleRadius,1,'white','black');

        let circle = {
            left: centerPoint.x, top: centerPoint.y,
            originX: 'center' , originY: 'center',
            fill: 'green',
            radius: 10,
            stroke: 'black',
            strokeWidth: 2,
            selectable: false,
            hoverCursor: 'cursor'
        };
        let readyCircle = new fabric.Circle(circle);

        readyCircle.on("mousedown", function (options) {
            netframe.log('Clicked Ready Button!');
            setReadyTextVisibility(false);
            btnCallback();
            //loadBubbleScene();
        });

        canvas.add(readyText);
        canvas.add(readyCircle);
        /*
        readyGroup = new fabric.Group([readyText, readyCircle], {
            left: centerPoint.x,
            top: centerPoint.y,
            originX: 'center',
            originY: 'bottom' - circleRadius/2,
            selectable: false,
            hoverCursor: 'cursor',
            subTargetCheck: true
        });
        canvas.add(readyGroup);*/

    }else{
        readyText = null;
        readyCircle = null;
        canvas.clear();
    }

}


function setupWindowChange(){
    window.onresize = function(event) {
        netframe.log('Window resize...');
        setTimeout(
            function() {
                calculateSizes();
            }, 1000);

    };
}

function removeWindowChange(){
    window.onresize = function(event) {};
}

function initTimer(){

    let startTime = new Date().getTime();

    mouseTimer = setInterval(function() {

        // Get todays date and time
        let date = new Date();
        let now = date.getTime();


        // Find the distance between now and the count down date
        let elapsedTime = now - startTime;

        // Time calculations for days, hours, minutes and seconds
        let days = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
        let hours = Math.floor((elapsedTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);

        //netframe.log('Elapsed time --- ' + days + "d " + hours + "h " + minutes + "m " + seconds + "s " + elapsedTime + 'ms');
    });
}

function disableTracking(){
    canvas.off('mouse:move');
}

function enableTracking(){

    let startTime = new Date().getTime();
    mouseData.length = 0;

    canvas.on('mouse:move', function(options) {
        //netframe.log('X: ' + options.e.layerX + ', Y: ' + options.e.layerY);

        let now = new Date().getTime();

        // Find the distance between now and the count down date
        let elapsedTime = now - startTime;

        let data = new dataClasses.MouseData(options.e.layerX, options.e.layerY, elapsedTime);
        mouseData.push(data);

        //netframe.log('Logging mouse data: ' + JSON.stringify(data));
    });
}

function loadLobby(round, maxRound, numberOfPlayers, maxPlayers){
    netframe.log('loadLobby called() on view');
    //currentState = State.Lobby;
    canvas.clear();
    createGUI();
    updateGUI(numberOfPlayers, maxPlayers);
    drawRoundNumber(round, maxRound);
}

function loadImages(){
    fabric.util.loadImage(emoji, function(img) {
        emojiImg = img;
    });

    fabric.util.loadImage(speechBubble, function(img) {
        speechBubbleImg = img;
    });
}

/*
function loadScene(sceneData){
    canvas.loadFromJSON(sceneData, function() {
        alert(' this is a callback. invoked when canvas is loaded! ');
    });
}

function saveScene(sceneData){
     sceneData = JSON.stringify(canvas);
}
*/
function loadRewardScene(bubbleIdGuess, colorAnswer, money){
    netframe.log('Loading reward scene...');
    //currentState = State.Reward;
    canvas.clear();
    mouseData.length = 0;

    let selectedBubble = netframe.getMyNetworkIdentity().selectedBubble;
    //netframe.log('showing selected bubble: ' + JSON.stringify(selectedBubble));

    let selectedPosition = {x: 0, y: 0};
    let selectedPie = makeBubble(-1, 0, 0, 50, selectedBubble.colors);
    let selectedText = createText('You choose:', {x: 0, y: -75, originX: 'center', originY: 'center'}, 'black');
/*
    let answerPosition = {x: 200, y: 0};
    let answerPie = makeBubble(-1, 0, 0, 50, [colorAnswer]);
    let answerText = createText('Correct choice:', {x: 0, y: -75, originX: 'center', originY: 'center'}, 'black');
*/
    let selectedSubGroup = createSubGroup([selectedPie, selectedText], selectedPosition);
  //  let answerSubGroup = createSubGroup([answerPie, answerText], answerPosition);

    //netframe.log('Created selectedSubGroup: ' + JSON.stringify(selectedSubGroup));
    //netframe.log('Created answerSubGroup: ' + JSON.stringify(answerSubGroup));

    //netframe.log('Creating group...');
    let group = createGroup([selectedSubGroup]);
    //netframe.log('Created group: ' + JSON.stringify(group));
    canvas.add(group);

    let moneyContent = "";
    if(money > 0){
        moneyContent = 'You guessed right! You earned: ' + money.toString();// +'\nYour total: ' + netframe.getMyNetworkIdentity().totalScore;
    }else{
        moneyContent = 'You guessed wrong! You lost: ' + (money).toString();// +'\nYour total: ' + netframe.getMyNetworkIdentity().totalScore;
    }
    let moneyText = createText(moneyContent, {x: centerPoint.x, y: centerPoint.y + 200, originX: 'center', originY: 'center'}, 'black', 45);
    addToCanvas(moneyText);

    drawRoundNumber();

/*
    setTimeout(loadSocialScene, 5000);
    */
}


function loadSocialScene(round){
    //currentState = State.Avatar;
    canvas.clear();
    createAvatars(round);
    //enableTracking();
    mouseData.length  = 0;
    netframe.getMyNetworkIdentity().selectedPartipants = [];


    readyText = createText('Click here when you are ready.', {x: centerPoint.x, y: canvas.height * 0.95, originX: 'center', originY: 'center'}, 'red', 30);
    readyText.on("mousedown", function (options) {
        netframe.log('Clicked on ready text');
        clickedReady();
        readyText.setColor('green');
    });
    addToCanvas(readyText);

    //drawRoundNumber();
}

function clickedReady(){
    netframe.log('clickedReady() called on view');
    if(netframe.getMyNetworkIdentity().isReady){
        netframe.log('Already clicked ready..');
        return;
    }
    clientController.cmdSelectParticipant(netframe.getMyNetworkIdentity().selectedPartipants, mouseData);
    netframe.getMyNetworkIdentity().isReady = true;
    readyText.set('text', 'Waiting for others...');
    disableTracking();
}

function selectParticipant(participantClientId, text, avatar){
    netframe.log('Clicked avatar #' + participantClientId);
    if(netframe.getMyNetworkIdentity().selectedPartipants.includes(participantClientId)) {
        return;
    }
    let content = text.get('text');
    let lastBubbleColors = netframe.getNetworkIdentityFromClientId(participantClientId).selectedBubble.colors;
    let colorsShortened = lastBubbleColors.map(color => color.charAt(0));
    if(lastBubbleColors){
        text.set('text', content + '\n' + colorsShortened);
    }
    netframe.getMyNetworkIdentity().selectedPartipants.push(participantClientId);

    //avatar.filters[0].rotation = 2 * Math.random() - 1;
    avatar.filters.push(new fabric.Image.filters.Grayscale());
    avatar.applyFilters();
    canvas.requestRenderAll();
}

function createAvatars(round){
    netframe.log('creating Avatar');

    let networkIdentities = Object.values(netframe.getNetworkIdentities());
    //netframe.log('Got network identities: ' + JSON.stringify(networkIdentities));

    let gridCount = Math.ceil(Math.sqrt(networkIdentities.length));
    let gridSizePercentage = 100/(gridCount); //%
    let maxSize = Math.min(canvas.getWidth(), canvas.getHeight());
    let gridSize = maxSize * (gridSizePercentage / 100);
    //let gridCount = Math.floor(maxSize / gridSize);

    //netframe.log('Calculated bounds of screen\nmaxSize: ' + maxSize + '\ngridSize: ' + gridSize + '\ngridCount: ' + gridCount);

    let grid = [];
    for (let x = 0; x < gridCount; x++){
        grid[x] = [];
        for (let y = 0; y < gridCount; y++){
            grid[x][y] = {x: x * gridSize, y: y * gridSize};
        }
    }

    //netframe.log('Finished calculating grid absolute values : ' + JSON.stringify(grid));

    let spacing = {x: canvas.getWidth() * 0.25, y: canvas.getHeight() * 0.25};
    let avatarSize = gridSize/2;
    let speechSize = {x: gridSize/2, y: gridSize/2};
    let speechOffset = {x: speechSize.x * 0.5, y: -speechSize.y * 0.5};

    let groupArr = [];

    let speechBubbles = [];

    let myIndex = netframe.getMyNetworkIdentity().identityId;

    let avatarPositionCounter = 0;
    for(let index in networkIdentities){
        let i = Number(index);
        if(networkIdentities[i].identityId === myIndex){
            //skip so we don't show own avatar
            continue;
        }
        netframe.log('Iterating i: ' + i);
        let subGroupArr = [];


        //let avatarPos = getAvatarPosition(avatarPositionCounter);
        let x = i % gridCount;
        //let y = ((i-x) / gridCount);
        netframe.log('Getting position of X: ' + x + ', Y: ' + y + ', in grid' );
        let avatarPos = grid[x][y];

        avatarPositionCounter++;
        //netframe.log('Got avatar position: ' + JSON.stringify(avatarPos));
        let position = {
            x: avatarPos.x,// * spacing.x,
            y: avatarPos.y,// * spacing.y,
        };


        let emoji = new fabric.Image(emojiImg);
        emoji.set({
            left: 0,
            top: 0,
            originX: 'center',
            originY: 'center',
        });
        //emoji.scaleToHeight(avatarSize);
        emoji.scaleToWidth(avatarSize);
        //emoji.filters = [new fabric.Image.filters.HueRotation()];

        subGroupArr.push(emoji);


        let speechBubble = new fabric.Image(speechBubbleImg);
        speechBubble.set({
            left: speechOffset.x,
            top: speechOffset.y,
            originX: 'center',
            originY: 'center'
        });

        //speechBubble.scaleToHeight(speechSize.y);
        speechBubble.scaleToWidth(speechSize.x);
        speechBubbles.push(speechBubble);

        subGroupArr.push(speechBubble);

        // + '\nP = ' + networkIdentities[i].popularityFactor + '%'
        let text = createText('Player: ' + (networkIdentities[i].identityId + 1) + '\nT: ' + networkIdentities[i].lastScore, {x: speechOffset.x, y: speechOffset.y - 10, originX: 'center', originY: 'center'}, 'green', 20);
        subGroupArr.push(text);

        // Subgroup
        let subGroup = createSubGroup(subGroupArr, position);
        groupArr.push(subGroup);
        netframe.log('--- Created Subgroup:\n' + JSON.stringify(subGroup));

        subGroup.on("mousedown", function (options) {
            selectParticipant(networkIdentities[i].clientId, text, emoji);
        });
    }

    // Main group
    let group = createGroup(groupArr);
    /*
    let group = new fabric.Group(groupArr, {
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
        selectable: false,
        hoverCursor: 'cursor',
        subTargetCheck: true
    });
    */
    canvas.add(group);
    netframe.log('--- Created Avatar Group:\n' + JSON.stringify(group));

}


/*
function getAvatarPosition(i){
    netframe.log('Getting AvatarPosition of i: ' + i);
    switch (i) {
        case 0:
            return {x: -1, y: -1};
        case 1:
            return {x: 1, y: -1};
        case 2:
            return {x: -1, y: 1};
        case 3:
            return {x: 1, y: 1};
        default:
            netframe.log('Error getting avatar position');
            return {x: 0, y: 0};
    }
}
*/
function createSubGroup(groupArr, position){
    return new fabric.Group(groupArr, {
        left: position.x,
        top: position.y,
        originX: 'center',
        originY: 'center',
        selectable: false,
        hoverCursor: 'cursor',
        subTargetCheck: true
    });
}

function createGroup(groupArr){
    return new fabric.Group(groupArr, {
        left: centerPoint.x,
        top: centerPoint.y,
        originX: 'center',
        originY: 'center',
        selectable: false,
        hoverCursor: 'cursor',
        subTargetCheck: true
    });
}

let countDownInterval;
function startCountDown(callback){
    netframe.log('Starting countdown...');
    let timer = 3;

    countDownInterval = setInterval(function() {
        netframe.log('Timer: ' + timer);

        playersTxt.set('text', 'Round starting in... ' + timer);
        render();

        if(timer == 0){
            clearInterval(countDownInterval);
            callback();
            return;
        }

        timer--;

    }, 1000);
}

function startRound(moneyGroups, round, maxRounds){
    netframe.log('startRound() was called');
    this.moneyGroups = moneyGroups;
    canvas.clear();
    createGUI();
    setReadyTextVisibility(true, loadBubbleScene(moneyGroups, round, maxRounds));
}

function loadBubbleScene(moneyGroups, round, maxRounds){
    netframe.log('Loading bubble scene...');
    //currentState = State.Bubble;
    createCardSet(moneyGroups);
    enableTracking();
    drawRoundNumber(round, maxRounds);
}

function drawRoundNumber(round, maxRounds){
    netframe.log('drawRoundNumber() called');

    let content = 'Round ' + round + ' / ' + maxRounds;
    /*
    if(netframe.getMyNetworkIdentity()){
        content += '\nYour total: ' + netframe.getMyNetworkIdentity().totalScore
    }*/
    let position = {x: 50, y: 50, originX: 'left', originY: 'top'};
    let color = 'black';
    let roundText = new createText(content, position, color);
    addToCanvas(roundText);
}

function loadFinalScene(score){
    netframe.log('loadFinalScene() called with score: ' + score);
    canvas.clear();
    //currentState = State.End;

    let content = 'Game over\n Thanks for participating\nThis is your final score:';
    let position = {x: centerPoint.x, y: centerPoint.y - 100, originX: 'center', originY: 'center'};
    let color = 'black';
    let roundText = createText(content, position, color, 30);
    addToCanvas(roundText);

    let scoreText = score.toString();
    netframe.log('final score: ' + scoreText);
    /*
    // all players
    for(let i in netframe.getNetworkIdentities()){
        let networkIdentity = netframe.getNetworkIdentities()[i];
        scoreText += 'Player ' + i + ': ' + networkIdentity.totalScore + '\n';
    }*/

    let position2 = {x: centerPoint.x, y: centerPoint.y, originX: 'center', originY: 'center'};
    let color2 = 'black';
    let totalScoreText = createText(scoreText, position2, color2, 70);
    addToCanvas(totalScoreText);

    let contentLink = 'Now please complete the survey\nby clicking on this text.';

    let positionLink = {x: centerPoint.x, y: centerPoint.y + 100, originX: 'center', originY: 'center'};
    let colorLink = 'green';
    let urlText = createText(contentLink, positionLink, colorLink, 35);

    urlText.on("mousedown", function (options) {
        netframe.log('Redirecting to survey...');
        window.location.href = "https://aarhus.eu.qualtrics.com/jfe/form/SV_24UqZr5mtLPYbsh" + "?userID=" + netframe.getClientId();
    });
/*
    urlText.setSelectionStyles({ underline: true }, 8, 18);
    urlText.setSelectionStyles({linkURL: "https://www.google.com/"}, 2, 4);
    urlText.setSelectionStyles({linkName:"google.com"}, 8, 18);
    urlText.setSelectionStyles({fill:"rgba(0,0,255,1)"}, 8, 18);
    */
    addToCanvas(urlText);

    let resolution = {
        x: canvas.getWidth(),
        y: canvas.getHeight(),
    };
    clientController.cmdFinishedGame(resolution);
}

function createGUI(){
    netframe.log('createGUI() called');
    let content = 'test';
    let position = {x: centerPoint.x, y: centerPoint.y, originX: 'center', originY: 'center'};
    let color = 'red';
    playersTxt = new createText(content, position, color);
    addToCanvas(playersTxt);
}

function updateGUI(numberOfPlayers, maxPlayers){
    netframe.log('updateGUI() called with numberOfPlayers: ' + numberOfPlayers + ', maxPlayers: ' + maxPlayers);
    //let numberOfPlayers = Object.keys(netframe.getNetworkIdentities()).length;
    if(numberOfPlayers === maxPlayers){
        playersTxt.set('text', "Number of players: " + numberOfPlayers + '\nGame will start soon!');
    }else{
        playersTxt.set('text', "Number of players: " + numberOfPlayers + '\nWaiting for more players...');
    }

    render();
}

function addHint(hintText){
    netframe.log('addHint() called in view with content : ' + hintText);

    let position = {x: centerPoint.x, y: 100, originX: 'center', originY: 'center'};
    let color = 'black';
    let hintTextObj = createText(hintText, position, color, 35);

    addToCanvas(hintTextObj);
}

function createText(content, position, color, fontSize = 14){
    netframe.log('createText() called in view with content : ' + content + ', position:' + JSON.stringify(position) + ', color: ' + color);
    let text = new fabric.IText(content, {
        fontFamily: 'Verdana',
        left: position.x, top: position.y,
        originX: position.originX, originY: position.originY,
        fill: color,
        selectable: false,
        hoverCursor: 'cursor',
        fontSize: fontSize,
        lineHeight : 1,
        textAlign: 'center',
        editable: false
    });
    //netframe.log('created Text: ' + JSON.stringify(playersTxt));
    return text;
}

function addToCanvas(view){
    netframe.log('addToCanvas() called...');
    canvas.add(view);

    //netframe.log('Checking type of view object: ' + view.get('type'));
    if(view.get('type') === "i-text"){
        netframe.log('Bringing text to front...');
        canvas.bringToFront(view);
    }
    //netframe.log('rendering all...');
    canvas.renderAll();
}


function render(){
    canvas.renderAll();
}

function reset() {
    netframe.log('reset() called on client view');
    entityViewMap = new Map();

    disableTracking();
    removeWindowChange()
}

function calculateSizes(){

    if(canvasSize){
        scaleCanvas();
    }

    netframe.log('calculateSizes () called');
    canvas.clear();

    centerPoint.x = canvas.getWidth() / 2;
    centerPoint.y = canvas.getHeight() / 2;
    smallestScreenSize = Math.min(canvas.getWidth()/2, canvas.getHeight()/2);
    strokeWidth = smallestScreenSize * (spacingPercentage - gapPercentage);
    gapWidth = smallestScreenSize * gapPercentage;

    netframe.log(
        'canvas.getWidth()' + canvas.getWidth() + ', canvas.getHeight(): ' + canvas.getHeight() + 
        '\ncenterpoint.x: ' + centerPoint.x + ', centerpoint.y: ' + centerPoint.y
        );

    canvasSize = { x : canvas.getWidth(), y : canvas.getHeight() };
    //redrawScene();
}

/*
function redrawScene(){
    netframe.log('Redrawing Scene');

    switch (currentState) {
        case 0:

            break;
        case 1:
            loadLobby();
            break;
        case 2:
            loadBubbleScene();
            break;
        case 3:
            loadRewardScene();
            break;
        case 4:
            loadSocialScene();
            break;
        case 5:
            loadFinalScene();
            break;
    }
}
*/

function createMoneyGroupsView(moneyGroupIndex, value) {
    netframe.log('creating moneyGroups boxes...');

    let color = new fabric.Color(colorBandArr[moneyGroupIndex]);
    //netframe.log('Band color: ' + JSON.stringify(color));

    // [0] = 20% --- [1] = 40% --- [2] = 60% --- [3] = 80% ---
    let percentageSpace = 0.2 + (moneyGroupIndex * spacingPercentage);

    let radius = smallestScreenSize * percentageSpace;
    //netframe.log('size of band: ' + radius);
    let band;

    //netframe.log('Creating money label..');
    let label = value.toString() + '$';

    if(moneyGroupIndex == 0){
        //create center sphere
        band = createBandView(-1, centerPoint.x, centerPoint.y, (radius + (strokeWidth/2)), 0, colorBandArr[moneyGroupIndex], 'none');
        //netframe.log('Adding moneyBand to canvas: ' + JSON.stringify(band));
        addToCanvas(band);

        let text1 = createText(label, {x: centerPoint.x, y: centerPoint.y, originX: 'center', originY: 'center'}, 'black');
        addToCanvas(text1);
    }else{
        band = createBandView(-1, centerPoint.x, centerPoint.y, radius, strokeWidth, 'transparent', colorBandArr[moneyGroupIndex]);
        //netframe.log('Adding moneyBand to canvas: ' + JSON.stringify(band));
        addToCanvas(band);

        let labelPosition1 = getPointOnCircle(radius, centerPoint.x, centerPoint.y, 0);
        let labelPosition2 = getPointOnCircle(radius, centerPoint.x, centerPoint.y, 180);
        let text1 = createText(label, {x: labelPosition1.x, y: labelPosition1.y, originX: 'center', originY: 'center'}, 'black');
        let text2 = createText(label, {x: labelPosition2.x, y: labelPosition2.y, originX: 'center', originY: 'center'}, 'black');
        addToCanvas(text1);
        addToCanvas(text2);
    }

    return band;
}

/*
function createMoneyGroupsView(moneyGroupIndex, value) {
    netframe.log('creating moneyGroups boxes...');

    let percentageSpace = 1 - (0.25 * moneyGroupIndex);
    let sizeX = canvas.getWidth() * percentageSpace;
    let sizeY = canvas.getHeight() * percentageSpace;
    let left = (canvas.getWidth() - sizeX) / 2;
    let top = (canvas.getHeight() - sizeY) / 2;

    let viewObj = {
        left: left, top: top,
        fill: 'white',
        selectable: false,
        hoverCursor: 'cursor',
        width: sizeX-1,
        height: sizeY-1,
        stroke : 'blue',
        strokeWidth : 1
    };

    netframe.log('Creating view from obj: ' + JSON.stringify(viewObj));

    let view = new fabric.Rect(viewObj);

    netframe.log('Adding moneyBox to canvas...');
    addToCanvas(view);

    netframe.log('Creating money label..');
    let label = value.toString() + '$';
    let text = createText(label, {x: left, y: top}, 'black');
    addToCanvas(text);



    return view;
}
*/
function createCardSet(set){
    netframe.log('CreateCardSet() called on client-view with set: ' + JSON.stringify(set));

    //netframe.log('Iterating moneyGroups...');
    for(let moneyGroupIndex in set){
        let moneyGroup = set[moneyGroupIndex];

        let moneyView = createMoneyGroupsView(moneyGroupIndex, moneyGroup.value);

        //netframe.log('Iterating moneyGroup: ' + JSON.stringify(moneyGroup));

        for(let bubbleIndex in moneyGroup.bubbles){
            let bubble = moneyGroup.bubbles[bubbleIndex];
            //netframe.log('Iterating cardGroup: ' + JSON.stringify(bubble));

            let position = getBubblePosition(moneyGroupIndex, bubbleIndex, moneyView);

            //netframe.log('Card position: ' + JSON.stringify(position));
            let id = bubble.id;
            let radius = smallestScreenSize * (spacingPercentage/2 - gapPercentage);
            //let bubble = createBandView(id, position.x, position.y, radius , 3, cardGroup.cards[0].color, 'black');

            let pie = makeBubble(id, position.x, position.y, radius, bubble.colors);
            if(pie){
                //netframe.log('createdPie with id: ' + pie.id + ' - adding to canvas');
                canvas.add(pie);
            }

/*
            for(let cardIndex in cardGroup.cards){
                let card = cardGroup.cards[cardIndex];
                netframe.log('Iterating card: ' + JSON.stringify(card));

                let id = card['id'];
                let color = card['color'];

                let position = getCardPosition(moneyGroupIndex, set.length-1, cardGroupIndex, cardIndex, moneyView);

                netframe.log('Card position: ' + JSON.stringify(position));
                let view = createView(id, 'Rect', position, color, 1);
            }
            */
        }
    }
}

function createBandView(id, x, y, radius, strokeWidth, fillColor, strokeColor){
    netframe.log('createBandView() called');
    let viewObj = {
        left: x, top: y,
        originX: 'center' , originY: 'center',
        fill: fillColor,
        radius: radius,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        selectable: false,
        hoverCursor: 'cursor'
    };

    if(id >= 0){
        viewObj.id = id;
    }else{
        viewObj.evented = false;
    }

    let view = new fabric.Circle(viewObj);

    //netframe.log('Created View: ' + JSON.stringify(view) + ', adding to canvas...');


    entityViewMap.set(id, view);

    //netframe.log('Finished creating band!');
    return view;
}

function getPointOnCircle(radius, originX, originY, angle){
    let x = originX + radius * Math.cos(getRadian(angle));
    let y = originY + radius * Math.sin(getRadian(angle));
    return {x: x, y: y};
}

function getRadian(angle){
    return (angle * Math.PI / 180);
}

function getBubblePosition(moneyGroupIndex, cardGroupIndex, moneyView){
    netframe.log('getBubblePosition() called with...');

    let percentageSpace = 0.2 + (moneyGroupIndex * spacingPercentage);

    let radius = smallestScreenSize * percentageSpace;

    let angle = 0;

    //netframe.log('Switch on card group index: ' + cardGroupIndex);
    switch (parseInt(cardGroupIndex)) {
        case 0:
            //netframe.log('Case 0');
            angle = 30; //45
            break;
        case 1:
            //netframe.log('Case 1');
            angle = 90;
            break;
        case 2:
            //netframe.log('Case 2');
            angle = 150; //135;
            break;
        case 3:
            //netframe.log('Case 3');
            angle = 210; //225;
            break;
        case 4:
            //netframe.log('Case 4');
            angle = 270;
            break;
        case 5:
            //netframe.log('Case 5');
            angle = 330; //315;
            break;
        default:
            netframe.log('Failed to find case!');
            break;
    }

    return getPointOnCircle(radius, centerPoint.x, centerPoint.y, angle);
}

function makeBubble(id, left, top, r, colors){
    netframe.log('Making Bubble with args: ' + JSON.stringify(arguments));
    let pie = drawPie(id, left, top, r, colors);

    //netframe.log('Applying mousedown event to new bubble with id: ' + pie.id);
    pie.on("mousedown", function (options) {
        netframe.log('Clicked on bubble...');
        if(options.target) {
            if (options.target.id) {
                clickedBubble(options.target.id);
            }else{
                netframe.log('target has no id');
            }
        }
    });

    return pie;
}

// radians in a circle = Math.PI * 2
// arc always moves around counter clockwise
// coordinate system is upper-left corner
function drawPie(id, left, top, r, colors) {
    netframe.log('drawPie() called');
    if(colors.length <= 1){
        return createBandView(id, left, top, r , 1, colors[0], 'black');
    }

    let wedges = [];

    // calculate center
    let cx = left + r;
    let cy = top + r;

    // set last ending point as top of circle
    let lastX = cx;
    let lastY = top;

    // calculate radians per wedge
    let radians = (Math.PI * 2) / colors.length;

    for(let i = 0; i < colors.length; i++) {
        // calculate next point on circle
        let x = cx + Math.sin(radians * (i + 1)) * -r;
        let y = cy + Math.cos(radians * (i + 1)) * -r;

        // move to center, line to last point, arc to next point, close path
        // arc: (rx ry x-axis-rotation large-arc-flag sweep-flag x y)
        let p = 'M'+cx+','+cy+' L'+lastX+','+lastY+' A'+r+','+r+' 0 0 0 '+x+','+y+' z';

        let path = new fabric.Path(p, {fill: colors[i], stroke: 'black'});
        wedges.push(path);

        lastX = x;
        lastY = y;
    }

    let group = new fabric.Group(wedges, {
        left: left,
        originX: 'center' , originY: 'center',
        top: top,
        perPixelTargetFind: true,
        lockRotation: true,
        custom: {'type': 'pie'},
        selectable: false,
        hoverCursor: 'cursor'
    });


    if(id >= 0){
        group.id = id;
        //netframe.log('Applying ID: ' + id + ' to group');
    }else{
        netframe.log('ID : ' + id + ' + is not valid!');
    }

    //netframe.log('Returning group from drawPie()...');
    return group;
}

function clickedBubble(id){
    netframe.log('A bubble was clicked with ID: ' + id);
    //let bubble = modelController.getCardGroupById(id);
    netframe.log('Sending cmdSelectBubble to server with mouseData: ' + JSON.stringify(mouseData));
    disableTracking();
    clientController.cmdSelectBubble(id, mouseData);
    
}

const Iview = {
    init: init,
    render: render,
    reset: reset,
    createGUI: createGUI,
    updateGUI: updateGUI,
    createCardSet: createCardSet,
    loadAvatarScene: loadSocialScene,
    loadRewardScene: loadRewardScene,
    loadBubbleScene: loadBubbleScene,
    loadLobby: loadLobby,
    startRound: startRound,
    loadFinalScene: loadFinalScene,
    addHint: addHint
};

export default Iview;