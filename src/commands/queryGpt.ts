import { RepliableInteraction, SlashCommandBuilder } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_TOKEN,
});

export default {
  command: new SlashCommandBuilder()
  .setName('gpt')
  .setDescription('query gpt api')
  .addStringOption(builder => 
    builder
    .setName('model')
    .setDescription('the gpt model to use')
    .setChoices({ name: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo'}, { name: 'gpt-4 regular', value: 'gpt-4' })
  )
  .addStringOption(builder => 
    builder
    .setName("prompt")
    .setDescription("what to ask the gpt")  
  ),
  executor: async (interaction: RepliableInteraction) => {
    await interaction.deferReply();
    // TODO - fix types
    const data = (interaction as any)['options'].data;
    const model = data.find((payload: any) => payload.name === "model") ?? 'gpt-3.5-turbo';
    const prompt = data.find((payload: any) => payload.name === "prompt");

    if(!prompt) {
      interaction.editReply("No prompt sent");
      return;
    }
    
    try {
      const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt.value }],
          model: model.value,
      });
  
      const gptResponse = chatCompletion.choices.map(response => `${response.message.content}`).join("\n");
      interaction.editReply(`Prompt: ${prompt.value} \n ${gptResponse}`);
    } catch(error) {  
      interaction.editReply(`Error prompting chatGPT`);
    }
  },
};