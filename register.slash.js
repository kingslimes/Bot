const { REST, Routes } = require('discord.js');
const fs = require('fs');
const slashCommands = fs.readdirSync('./commands').filter( i => i.endsWith(".js") ).map( (name, index, arr) => arr[index] = require(`./commands/${name}`) );
const commands = slashCommands.map( value => value.data.toJSON() );
new REST({ version:'10' }).setToken( process.argv[2] ).put( Routes.applicationCommands( process.argv[3] ), { body:commands } );