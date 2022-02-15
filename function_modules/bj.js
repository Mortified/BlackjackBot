//creates a 2D array representing a 52 card deck in the 4 standard suits (third array value for each card will represent actual card value)
exports.freshDeck = function(){
    var nuDeck = new Array(52);
    var i = 0;
    for(var s = 0; s < 4; s++)
    {
        for(var v = 2; v < 15; v++)
        {
            nuDeck[i] = new Array(3);
            nuDeck[i][0] = toSuit(s);
            nuDeck[i][1] = toFace(v);
            if(v < 11){
                nuDeck[i][2] = v;
            }
            else if(v == 14){
                nuDeck[i][2] = 11;
            }
            else{
                nuDeck[i][2] = 10;
            }
            i++;
        }
    }
return nuDeck;
};
//takes an integer value and returns an ascii suit symbol based on the value
toSuit = function(suitNum){
    switch(suitNum){
        case 0:
            return '♣';
        case 1:
            return '♦';
        case 2:
            return '♥';
        default:
            return '♠';
    }
}
//takes an integer value and returns the apropriate face card letter or a number if there is no appropriate value
toFace = function(cardNum){
    switch(cardNum){
        case 11:
            faceVal = 'J';
            break;
        case 12:
            faceVal = 'Q';
            break;
        case 13:
            faceVal = 'K';
            break;
        case 14:
            faceVal = 'A';
            break;
        default:
            faceVal = '' + cardNum;
    }
    return faceVal;
}
//return art for a card based on passed parameters
exports.toCardArt = function(suitSym, cardSym){
    cardArt  = ' _____'  + '\n';
    if(cardSym.length > 1){
        cardArt += '|' + cardSym +'   |' + '\n';
    }
    else{
        cardArt += '|' + cardSym +'    |' + '\n';
    }
    cardArt += '|     |' + '\n';
    cardArt += '|  ' + suitSym + '  |' + '\n';
    cardArt += '|     |' + '\n';
    if(cardSym.length > 1){
        cardArt += '|___' + cardSym +'|';
    }
    else{
        cardArt += '|____' + cardSym +'|';
    }
    return cardArt;
}
//return art for Streaky's opening hand in blackjack, takes an array of atleast 2 cards
exports.toBlkJckHand = function(handCards){
    handArt  = ' _____   _____'  + '\n';
    if(handCards[1][1].length > 1){
        handArt += '|X   X| |' + handCards[1][1] +'   |' + '\n';
    }
    else{
        handArt += '|X   X| |' + handCards[1][1] +'    |' + '\n';
    }
    handArt += '| X X | |     |' + '\n';
    handArt += '|X X X| |  ' + handCards[1][0] + '  |' + '\n';
    handArt += '| X X | |     |' + '\n';
    if(handCards[1][1].length > 1){
        handArt += '|X___X| |___' + handCards[1][1] +'|';
    }
    else{
        handArt += '|X___X| |____' + handCards[1][1] +'|';
    }
    return handArt;

}
//returns a string representing a series of cards based on an array of card details e.g. [[suitSym1,cardSym1],[suitSym2,cardSym2],[suitSym3,cardSym3]...]
exports.drawHand = function(handCards)
{
    var handArt = '';
    for(var crdTp = 0; crdTp < handCards.length; crdTp++)
    {
        handArt += ' _____';
        if(crdTp == (handCards.length - 1)){
            handArt += '\n';
            break;
        }
        handArt += '  ';
    }
    for(var upSym = 0; upSym < handCards.length; upSym++)
    {
        if(handCards[upSym][1].length > 1){
            handArt += '|' + handCards[upSym][1] +'   |';
        }
        else{
            handArt += '|' + handCards[upSym][1] +'    |';
        }
        if(upSym == (handCards.length - 1)){
            handArt += '\n';
            break;
        }
        handArt += ' ';
    }
    for(var crdMid = 0; crdMid < handCards.length; crdMid++)
    {
        handArt += '|     |';
        if(crdMid == (handCards.length - 1)){
            handArt += '\n';
            break;
        }
        handArt += ' ';
    }
    for(var crdSuit = 0; crdSuit < handCards.length; crdSuit++)
    {
        handArt += '|  ' + handCards[crdSuit][0] + '  |';
        if(crdSuit == (handCards.length - 1)){
            handArt += '\n';
            break;
        }
        handArt += ' ';
    }
    for(var crdMid = 0; crdMid < handCards.length; crdMid++)
    {
        handArt += '|     |';
        if(crdMid == (handCards.length - 1)){
            handArt += '\n';
            break;
        }
        handArt += ' ';
    }
    for(var dnSym = 0; dnSym < handCards.length; dnSym++)
    {
        if(handCards[dnSym][1].length > 1){
            handArt += '|___' + handCards[dnSym][1] +'|';
        }
        else{
            handArt += '|____' + handCards[dnSym][1] +'|';
        }
        if(dnSym == (handCards.length - 1)){
            break;
        }
        handArt += ' ';
    }
    return handArt;
}
//generate and return the response for the !stand & !doubledown command based on final scores
exports.resultMsg= function(dlrScr, plyrScr){
    if(dlrScr == plyrScr){
        return 'Push! Nobody wins... *dull*';
    }
    else if(dlrScr > 21){
        return 'Dealer Busts! You win!';
    }
    else if(dlrScr > plyrScr)
    {
        return 'Dealer beats Player! You lose! Unfortunate.';
    }
    else{
        return 'Player beats Dealer! You win! Good Job!';
    }
}