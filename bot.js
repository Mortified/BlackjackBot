const client = require('./client.js');

var auth = require('./auth.json');
var art = require('./function_modules/art.js');
var bj = require('./function_modules/bj.js');
var db = require('./function_modules/db.js');
var samTools = require('./function_modules/samTools.js');
var mysql = require('mysql');
var con;

function handleDisconnect() {
  con = mysql.createConnection(db.dbConfig);  // Recreate the connection, since the old one cannot be reused.
  con.connect( function onConnect(err) {   // The server is either down
      if (err) {                                  // or restarting (takes a while sometimes).
          console.log('error when connecting to db:', err);
          setTimeout(handleDisconnect, 10000);    // We introduce a delay before attempting to reconnect,
      }                                           // to avoid a hot loop, and to allow our node script to
  });                                             // process asynchronous requests in the meantime.
                                                  // If you're also serving http, display a 503 error.
  con.on('error', function onError(err) {
      console.log('db error', err);
      if (err.code == 'PROTOCOL_CONNECTION_LOST') {   // Connection to the MySQL server is usually
          handleDisconnect();                         // lost due to either server restart, or a
      } else {                                        // connnection idle timeout (the wait_timeout
          throw err;                                  // server variable configures this)
      }
  });
}

handleDisconnect();

var dealDeck = bj.freshDeck();
var user_array;

//load sql data into array for fast handling
con.query('SELECT discordID, username, chips FROM user_totals', function (err, result){
    if (err) throw err;
        user_array = result;
        console.log('Records Loaded:' + user_array.length);
});
//blackjack instantiation
var blkJckDeck;
var blkJckUserRec = null;
var blkJckUserBet = null;
var playerHnd = [];
var strkHnd = [];
var playerScore = 0;
var playerAces = 0;
var strkScore = 0;
var strkAces = 0;

function cheeky2SecTimer(){
    return new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 2000);
      });
}
//accepts an array of objects with atleast a "discordID" object property in each entry and a string to match against it, returns the record iteration within the array if found
function findRec(recArray, ID){
    i = 0;
    for(x of recArray){
        if (x.discordID == ID){
            return i;
        }
        i++;
    }
    return null;
}

// login to Discord with your app's token
client.login(auth.token);

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', async message => {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '!') {
        console.log(message.content);
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {

            // !privatetable
            case 'privatetable':
                if(message.author.bot){
                    break;
                }
                message.author.send('Hello there! Send "!bj[your bet]" to start a game!');
                break;

            // !card
            case 'card':
                // Generate random card value and suit, had to replace accursed Emojis with Unicode characters
                message.channel.send('Is THIS your card?\n```' + bj.toCardArt(toSuit(Math.floor(Math.random() * 4)),toFace(Math.floor(Math.random() * 13)+2)) + '```');
                break;

            // !deal
            case 'deal':
                // Takes a number between 1 and 5 and get that many random cards from a fresh deck
                pick = args[0];
                if(dealDeck.length < pick){
                    dealDeck = bj.freshDeck();
                }
                if(pick == 665){
                    message.channel.send(':black_joker:' );
                }
                else if(pick < 10 || pick >= 1){
                    handArray = new Array(pick);
                    for(i = 0; i < pick; i++)
                    {
                        randCard = Math.floor(Math.random() * dealDeck.length);
                        handArray[i] = dealDeck[randCard];
                        dealDeck.splice(randCard,1);
                    }
                    message.channel.send('Remaining Cards: ' + dealDeck.length + '\n' + '```' + bj.drawHand(handArray) + '```');
                }
                else{
                    message.channel.send('Selection out of range!\n' + 'Max 10 cards currently accepted! You entered: ' + args[0]);
                }
                break;
            // !cube
            case 'cube':
                message.channel.send(art.cube());
                break;
            // !toucan
            case 'toucan':
                message.channel.send(art.toucan());
                break;

            // !blackjack, !bj
            case 'blackjack':
            case 'bj':
                // starts a game of blackjack if there isn't already one
                // check if an active player is set, if they are then reject starting a new game
                if(blkJckUserRec != null){
                    message.channel.send('<@' + user_array[blkJckUserRec].discordID + '> has a game in progress, wait your turn!');
                    break;
                }
                // set the player/user of the game
                blkJckUserRec = findRec(user_array, message.author.id);
                if(blkJckUserRec == null){
                    message.reply('No record found! Use the "!chips" command to create your record');
                    break;
                }
                else if(Math.floor(args[0]) <= user_array[blkJckUserRec].chips && Math.floor(args[0]) > 9){
                    blkJckUserBet = Math.floor(args[0]);
                }
                else if(Math.floor(args[0]) == 0){
                    message.reply('Bet of 0 detected. Initiating no stakes game.');
                    blkJckUserBet = 0;
                }
                else{
                    message.reply('Invalid bet! Make sure to enter an amount of 10 or more chips that\'s less than your total "!bj [amount]"');
                    blkJckUserRec = null;
                    break;
                }
                // generate the deck
                blkJckDeck = bj.freshDeck();
                // generate the starting hands
                for(i = 0; i < 2; i++)
                    {
                        randCard = Math.floor(Math.random() * blkJckDeck.length);
                        strkHnd.push(blkJckDeck[randCard]);
                        blkJckDeck.splice(randCard,1);
                        strkScore += strkHnd[i][2];
                        if(strkHnd[i][1] == 'A'){
                            strkAces++;
                        }
                    }
                    if(strkScore > 21){
                        strkAces--;
                        strkScore -= 10;
                    }
                for(i = 0; i < 2; i++)
                    {
                        randCard = Math.floor(Math.random() * blkJckDeck.length);
                        playerHnd.push(blkJckDeck[randCard]);
                        blkJckDeck.splice(randCard,1);
                        playerScore += playerHnd[i][2];
                        if(playerHnd[i][1] == 'A'){
                            playerAces++;
                        }
                    }
                if(playerScore > 21){
                    playerAces--;
                    playerScore -= 10;
                }

                bJMsg = '\nStreaky shows: ' + strkHnd[1][2] + '\n```' +
                        bj.toBlkJckHand(strkHnd) + '```\n' +
                        'You show: ';

                if(playerScore == 21){
                    bJMsg += playerScore + '```\n' +
                    bj.drawHand(playerHnd) + '```\n' +
                    'Enter "!stand" to pass to dealer';
                }
                else{
                    bJMsg += playerScore + '```\n' +
                    bj.drawHand(playerHnd) + '```\n' +
                    '"!hit" or "!stand" ?';
                }

                message.reply(bJMsg);
                break;

            case 'hit':
                if(blkJckUserRec == null)
                {
                    message.reply('No game! Use the "!blackjack" or "!bj" command to start a game');
                    break;
                }
                else if(message.author.id != user_array[blkJckUserRec].discordID)
                {
                    break;
                }
                randCard = Math.floor(Math.random() * blkJckDeck.length);
                playerHnd.push(blkJckDeck[randCard]);
                blkJckDeck.splice(randCard,1);
                playerScore += playerHnd[playerHnd.length - 1][2];
                if(playerHnd[playerHnd.length - 1][1] == 'A'){
                    playerAces++;
                }

                while (playerScore > 21 && playerAces > 0) {
                        playerAces--;
                        playerScore -= 10;
                }

                hitMsg = '\nStreaky shows: ' + strkHnd[1][2] + '\n```' +
                            bj.toBlkJckHand(strkHnd) + '```\n' +
                            'You show: '; 

                if(playerScore == 21){
                    hitMsg += '21!' + '```\n' +
                    bj.drawHand(playerHnd) + '```\n' +
                    'Enter "!stand" to pass to dealer';
                }
                else if (playerScore > 21){
                    hitMsg += playerScore + '```\n' +
                    bj.drawHand(playerHnd) + '```\n' +
                    'Bust! You lose! Too bad, so sad...\n' +
                    'Chips: ' + user_array[blkJckUserRec].chips + ' => ' + (user_array[blkJckUserRec].chips - blkJckUserBet);
                    strkHnd = [];
                    playerHnd = [];
                    playerScore = 0;
                    playerAces = 0;
                    strkScore = 0;
                    strkAces = 0;
                    user_array[blkJckUserRec].chips -= blkJckUserBet;
                    //function call to update sql entry: function(con, discordID, chips)
                    con.query('UPDATE user_totals SET chips = '+ user_array[blkJckUserRec].chips +' WHERE discordID = ' + user_array[blkJckUserRec].discordID , function (err, result){
                        if (err) throw err;
                        console.log(result);
                    });
                    blkJckUserRec = null;
                    blkJckUserBet = null;
                }
                else{
                    hitMsg += playerScore + '```\n' +
                    bj.drawHand(playerHnd) + '```\n' +
                    '"!hit" or "!stand" ?';
                }

                message.reply(hitMsg);
                break;

            case 'stand':
                if(blkJckUserRec == null)
                {
                    message.reply('No game! Use the "!blackjack" or "!bj" command to start a game');
                    break;
                }
                else if(message.author.id != user_array[blkJckUserRec].discordID)
                {
                    break;
                }
                standMsg = await message.channel.send('<@'+ user_array[blkJckUserRec].discordID +'>,\nStreaky shows: ' + strkScore + '\n```' +
                                        bj.drawHand(strkHnd) + '```');

                while(strkScore < 17){
                    await cheeky2SecTimer();
                        randCard = Math.floor(Math.random() * blkJckDeck.length);
                        strkHnd.push(blkJckDeck[randCard]);
                        blkJckDeck.splice(randCard,1);
                        strkScore += strkHnd[strkHnd.length - 1][2];
                        if(strkHnd[strkHnd.length - 1][1] == 'A'){
                            strkAces++;
                        }
                        while(strkScore > 21 && strkAces > 0){
                            strkAces--;
                            strkScore -= 10;
                        }
                        await standMsg.edit('<@'+ user_array[blkJckUserRec].discordID +'>,\nStreaky shows: ' + strkScore + '\n```' +
                                        bj.drawHand(strkHnd) + '```');
                }
                setTimeout( function(){
                    finalMsg = '';
                    if(strkScore > playerScore && strkScore < 22){
                        finalMsg = bj.resultMsg(strkScore, playerScore) + '\n' +
                                    'Chips: ' + user_array[blkJckUserRec].chips + ' => ' + (user_array[blkJckUserRec].chips - blkJckUserBet);
                        //player loses deduct bet
                        user_array[blkJckUserRec].chips -= blkJckUserBet;
                        //add function call to update sql entry: function(con, user.discordID, user.chips)
                        con.query('UPDATE user_totals SET chips = '+ user_array[blkJckUserRec].chips +' WHERE discordID = ' + user_array[blkJckUserRec].discordID , function (err, result){
                            if (err) throw err;
                            console.log(result);
                        });
                    }
                    else if(strkScore == playerScore){
                        finalMsg = bj.resultMsg(strkScore, playerScore) + '\n' +
                                    'Chips: ' + user_array[blkJckUserRec].chips + ' => ' + user_array[blkJckUserRec].chips;
                    }
                    else{
                        finalMsg = bj.resultMsg(strkScore, playerScore) + '\n' +
                                    'Chips: ' + user_array[blkJckUserRec].chips + ' => ' + (user_array[blkJckUserRec].chips + blkJckUserBet);
                        //player wins! 100% return
                        user_array[blkJckUserRec].chips += blkJckUserBet;
                        //add function call to update sql entry: function(con, discordID, chips)
                        con.query('UPDATE user_totals SET chips = '+ user_array[blkJckUserRec].chips +' WHERE discordID = ' + user_array[blkJckUserRec].discordID , function (err, result){
                            if (err) throw err;
                            console.log(result);
                        });
                    }
                    
                    standMsg.edit('<@'+ user_array[blkJckUserRec].discordID +'>,' + 
                                    '\nStreaky shows: ' + strkScore + '\n```' +
                                    bj.drawHand(strkHnd) + '```\n' +
                                    'You show: ' + playerScore + '\n```' +
                                    bj.drawHand(playerHnd) + '```\n'
                                    + finalMsg);

                    strkHnd = [];
                    playerHnd = [];
                    playerScore = 0;
                    playerAces = 0;
                    strkScore = 0;
                    strkAces = 0;
                    blkJckUserRec = null;
                    blkJckUserBet = null;
                }, 1500);
                break;
            // !chips, returns messager's balance of chips or adds you to the data base if they aren't already present
            case 'chips':
                requester = message.author;
                console.log(user_array);
                record = findRec(user_array, requester.id);
                if(record != null){
                    message.channel.send(samTools.MentionUser(requester.id) + ', Chips: ' + user_array[record].chips);
                }
                else{
                    message.channel.send(samTools.MentionUser(requester.id) + ', User unrecognised, adding to database, Chips: 100');
                    con.query('INSERT INTO user_totals (discordID, username, chips) VALUES (\'' + requester.id + '\', \'' + requester.username + '\', ' + 100+')', function (err, result){
                        if (err) throw err;
                        console.log(result);
                    });
                    user_array.push({discordID:requester, username:message.author.username, chips:100})
                }
                break;
         }
     }
});