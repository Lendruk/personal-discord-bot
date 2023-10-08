import { RepliableInteraction, SlashCommandBuilder } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_TOKEN,
});

type StringOption = {
  name: string;
  value: string;
}

type CommandOptionsPayload = {
  options: {
    data: StringOption[]
  }
}

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
    const data = (interaction as RepliableInteraction & CommandOptionsPayload).options.data;

    const model = data.find((payload) => payload.name === "model")?.value ?? 'gpt-3.5-turbo';
    const prompt = data.find((payload) => payload.name === "prompt");

    if(!prompt) {
      interaction.editReply("No prompt sent");
      return;
    }
    
    try {
      const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt.value }],
          model: model,
      });
  
      const gptResponse = chatCompletion.choices.map(response => `${response.message.content}`).join("\n");
      interaction.editReply(`Prompt: ${prompt.value} \nAnswer:\n ${gptResponse} \nModel used: ${model}`);
    } catch(error) {  
      interaction.editReply(`Error prompting chatGPT`);
    }
  },
};