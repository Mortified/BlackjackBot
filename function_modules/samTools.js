const client = require('./../client.js')

module.exports = {

	GetChannel: function (ChannelId){	
		return client.channels.cache.get(ChannelId);
	},

	PostInChannel: function (ChannelId,Post){	
		let channel = this.GetChannel(ChannelId);
		channel.send(Post);
	},
	
	GetUser: function (UserID){	
		return client.users.cache.get(UserID);
	},

	MentionUser: function (UserID){	
		let User = this.GetUser(UserID);
		return (`${User}`);
	},

	GetGuild: function (GuildID){	
		return client.guilds.cache.get(GuildID);
	},

	GetEmote: function (EmoteName){	
		return client.emojis.cache.find(emoji => emoji.name === EmoteName);
	},

	EmoteToString: function (EmoteName){	
		let Emote = this.GetEmote(EmoteName);
		return ('<:' + Emote.name + ':' + Emote.id + '>');
	},

	PersonalMsgUser: function (UserID,Msg){	
		this.GetUser(UserID).send(Msg);
	},
	//Roles is an array of all roles for the user
	AddRoles: function (userid, Roles){
		let user = this.GetUser(userid);
		let guild = this.GetGuild('193815348431028224');
		let member = guild.member(user);
		member.roles.add(Roles);
	},

	RemoveRoles: function (userid, Roles){
		let user = this.GetUser(userid);
		let guild = this.GetGuild('193815348431028224');
		let member = guild.member(user);
		member.roles.remove(Roles);
	},


}