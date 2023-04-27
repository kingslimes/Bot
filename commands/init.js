const { SlashCommandBuilder } = require('discord.js');
const sql = require('slimedb');
const guilds = new sql('guilds').createTable({
  id: sql.DataType.PRIMARY,
  guild: sql.DataType.NUMBER,
  channel: sql.DataType.NUMBER,
  message: sql.DataType.NUMBER
});
module.exports = {
  data: new SlashCommandBuilder()
    .setName('init')
    .setDescription('Create a music player.'),
  async run(interaction) {
    const reply = await interaction.deferReply({
      fetchReply: true
    });
    const existsGuild = sql.query(guilds).find(i => i.guild == interaction.guild.id);
    if (existsGuild) {
      sql.update(guilds, i => i.guild == interaction.guild.id, {
        channel: interaction.channel.id,
        message: reply.id
      });
    } else {
      sql.insert(guilds, {
        guild: interaction.guild.id,
        channel: interaction.channel.id,
        message: reply.id
      });
    }
    await interaction.editReply(' -- [ Song ] -- ')
  }
};