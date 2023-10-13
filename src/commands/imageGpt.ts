import { RepliableInteraction, SlashCommandBuilder } from "discord.js";
import { CommandOptionsPayload, DiscordCommand } from "../types/DIscordCommand";
import { openai } from "../util/openAI";

export default {
  command: new SlashCommandBuilder()
  .setName("img")
  .setDescription("generate an image from a prompt")
  .addStringOption(builder => builder.setName("prompt").setDescription("the prompt to generate an image from")),
  executor: async (interaction: RepliableInteraction) => {
    await interaction.deferReply();
    const data = (interaction as RepliableInteraction & CommandOptionsPayload).options.data;
    const prompt = data.find((payload) => payload.name === "prompt");
    if(!prompt || !prompt.value) {
      interaction.editReply("No prompt sent");
      return;
    }
    
    const response = await openai.images.generate({ prompt: prompt.value });
    const image = response.data[0];

    if(image.url) {
      await interaction.editReply({ embeds: [{ image: { url: image.url } } ] });
      await interaction.channel?.send(`Here's your requested ${prompt.value}`);
    } else {
      await interaction.editReply("Error generating image");
    }
  }
} as DiscordCommand