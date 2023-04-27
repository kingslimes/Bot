const { SlashCommandBuilder } = require('discord.js');
const sql = require('slimedb');
const guilds = new sql('guilds');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('clean')
    .setDescription('Remove all message in channel.'),
  async run(interaction) {
    const reply = await interaction.reply({
      content: "[INFO] Cleaning messages.",
      fetchReply: true
    });
    const existsGuild = sql.query(guilds).find(i => i.guild == interaction.guild.id);
    const messages = await interaction.channel.messages.fetch();
    let cm;
    if ( existsGuild ) {
      cm = messages.filter( i => i.id != existsGuild.message && i.id != reply.id );
      await interaction.channel.bulkDelete(cm);
    } else {
      cm = messages.filter( i => i.id != reply.id );
      await interaction.channel.bulkDelete(cm);
    }
    await interaction.editReply('[INFO] Cleaned messages successfully.').then( e => setTimeout(()=>{e.delete()}, 3000) );
  }
};
