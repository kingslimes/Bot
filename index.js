const { Client, GatewayIntentBits, Events, ActivityType } = require('discord.js');
const { Player, QueryType } = require('discord-player');
const { isHttpsUri } = require('valid-url');
const sqli = require('slimedb');
const fs = require('fs');

const guilds = new sqli('guilds');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.login( process.argv[2] );

const player = new Player( client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25
  }
})

const slashCommands = fs.readdirSync('./commands').filter( i => i.endsWith(".js") ).map( (name, index, arr) => arr[index] = require(`./commands/${name}`) );

client.on( Events.ClientReady, async bot => {
  console.log(`\n [INFO] ${bot.user.tag} now online.\n`);
  bot.user.setPresence({
    activities: [{
      name: 'Youtube Music',
      type: ActivityType.Listening
    }],
    status: 'online'
  });
});

client.on( Events.MessageCreate, async message => {
  if ( message.author.bot ) return 0;
  const GuildConfig = sqli.query( guilds ).find( i => i.guild == message.guild.id );
  const isURL = isHttpsUri( message.content );
  const userVoiceChannel = message.member.voice?.channel;
  if ( GuildConfig && GuildConfig.channel == message.channel.id ) {
    const msg = await message.channel.messages.fetch();
    const queue = player.createQueue( message.guild, {
      metadata: msg.get( GuildConfig.message ),
      spotifyBridge: true,
      initialVolume: 100,
      leaveOnEnd: true
    });
    if ( !userVoiceChannel ) {
      await message.reply("[ERROR] You are not in the voice room.").then( msg => {
        setTimeout( async () => {
          await msg.delete();
          await message.delete()
        }, 3000)
      });
      return !0;
    }
    if ( userVoiceChannel && !queue.connection ) {
      await queue.connect( userVoiceChannel );
    }
    if ( userVoiceChannel && queue.connection && ( queue.connection.channel.id == userVoiceChannel.id ) ) {
      const reply = isURL ? await message.reply(`[INFO] Now loading "${message.content}"`) : await message.reply(`[INFO] Searching for "${message.content}"`);
      const song = await player.search( message.content, {
        requestedBy: message.author,
        searchEngine: QueryType.AUTO
      });
      if ( song.tracks.length > 0 ) {
        await reply.edit("[INFO] Successfully added to track.").then( msg => {
          setTimeout( async () => {
            await msg.delete();
            await message.delete()
          }, 3000)
        });
        song.playlist ? queue.addTracks(song.tracks) : queue.addTrack(song.tracks[0]);
        !queue.playing && await queue.play();
      } else {
        await reply.edit("[ERROR] This song cloud not be found.").then( msg => {
          setTimeout( async () => {
            await msg.delete();
            await message.delete()
          }, 3000)
        });
        !queue.playing && queue.destroy();
      }
    } else {
      await message.reply("[ERROR] You can't use it from outside the voice room.").then( msg => {
        setTimeout( async () => {
          await msg.delete();
          await message.delete()
        }, 3000)
      });
    }
    
  }
});

client.on( Events.InteractionCreate, async interaction => {
  if ( !interaction.isChatInputCommand() ) return !0;
  await slashCommands.find( i => i.data.name == interaction.commandName ).run( interaction );
});
