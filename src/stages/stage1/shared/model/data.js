

export class GameData {
    constructor(riskyAnswers, ambAnswers, maxPlayers, totalRounds, gameMode, roundData, moneyGroups){
        this.riskyAnswers = riskyAnswers;
        this.ambAnswers = ambAnswers;
        this.maxPlayers = maxPlayers;
        this.totalRounds = totalRounds;
        this.gameMode = gameMode;
        this.roundData = roundData;
        this.moneyGroups = moneyGroups;
        this.finalResult = [];

    }
}

export class RoundData {
    constructor(round){
        this.round = round;
        this.participantRoundData = [];
    }
}

export class ParticipantData {
    constructor(id, age, gender, cpr, name, resolution){
        this.id = id;
        this.age = age;
        this.gender = gender;
        this.cpr = cpr;
        this.name = name;
        this.resolution = resolution;
    }
}

export class ParticipantRoundData {
    constructor(id, clientId, bubbleSceneData, socialSceneData){
        this.id = id;
        this.clientId = clientId;
        this.bubbleSceneData = bubbleSceneData;
        this.socialSceneData = socialSceneData;
    }
}

export class BubbleSceneData {
    constructor(selectedColors, groupValue, result, mouseData){
        this.selectedColors = selectedColors;
        this.groupValue = groupValue;
        this.result = result;
        this.mouseData = mouseData;
    }
}

export class SocialSceneData {
    constructor(popularityFactor, selectedParticipantsId, mouseData){
        //this.contributionFactor = contributionFactor;
        this.popularityFactor = popularityFactor;
        this.selectedParticipantId = selectedParticipantsId;
        this.mouseData = mouseData;
    }
}

export class MouseData {
    constructor(x, y, time){
        this.x = x;
        this.y = y;
        this.time = time;
    }
}
