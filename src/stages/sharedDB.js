export let participants = [];

export let gameSettings = {
    maxRounds: 1,
    gameMode: 'risky',
    maxPlayers: 1,
    networkMode: true,
    crossTableClientData: {}
};

export let uniformAnswers = ["YELLOW","ORANGE","BLUE","RED","YELLOW","GREEN","RED","RED","RED","PURPLE","GREEN","BLUE",
    "PURPLE","RED","ORANGE","ORANGE","PURPLE","BLUE","ORANGE","PURPLE","YELLOW","ORANGE","ORANGE","GREEN","YELLOW","RED",
    "ORANGE","PURPLE","GREEN","YELLOW","YELLOW","YELLOW","BLUE","PURPLE","YELLOW","PURPLE","RED","GREEN","GREEN",
    "RED","PURPLE","ORANGE","BLUE","BLUE","PURPLE","BLUE","BLUE","RED","ORANGE","BLUE","BLUE","GREEN","YELLOW","ORANGE",
    "GREEN","RED","GREEN","GREEN","PURPLE","YELLOW"];

export let distributedAnswers = ["GREEN","ORANGE","RED","BLUE","BLUE","RED","YELLOW","ORANGE","ORANGE","GREEN","PURPLE","BLUE",
    "ORANGE","ORANGE","GREEN","RED","ORANGE","ORANGE","GREEN","YELLOW","RED","RED","GREEN","YELLOW","GREEN","YELLOW","ORANGE",
    "GREEN","BLUE","YELLOW","ORANGE","BLUE","GREEN","GREEN","PURPLE","GREEN","PURPLE","BLUE","RED","ORANGE","ORANGE",
    "RED","RED","GREEN","BLUE","RED","GREEN","PURPLE","GREEN","ORANGE","BLUE","PURPLE","RED","BLUE","YELLOW","YELLOW",
    "ORANGE","ORANGE","ORANGE","GREEN"];

let keys = [];

export let setKeys = function (newKeys){
    keys = newKeys;
}

export let getKeys = function (newKeys){
    return keys;
}

export let isKeyUnique = function (id){
	for(var key in keys){
		if(key.id === id){
			return false;
		}
	}
	return true;
};

export let isKeyValid = function (keyId){
    console.log('isKeyValid called with keyId: ' + keyId);
    console.log('Number of keys in db: ' + keys.length);
    console.log('Printing keys: ' + JSON.stringify(keys));
	for(let i = 0, key; key = keys[i]; i++){
        console.log('comparing with: ' + JSON.stringify(key));
		if(key.id === keyId){
            if(key.inUse){
                console.log('key is already in use');
                return false;
            }else{
                console.log('key is valid');
                return true;
            }
		}
    }
    console.log('Key not found');
	return false;
};