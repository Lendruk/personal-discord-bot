import { MessagePayload, RepliableInteraction, SlashCommandBuilder, Utils } from "discord.js";
import { openai } from "../util/openAI";
import { CommandOptionsPayload } from "../types/DIscordCommand";

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
      await interaction.editReply("No prompt sent");
      return;
    }
    
    try {
      const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt.value }],
          model: model,
      });
  
      const gptResponse = chatCompletion.choices.map(response => `${response.message.content}`).join("\n");
      const formattedResponse = `Prompt: ${prompt.value} \nAnswer:\n${gptResponse} \nModel used: ${model}`;

      const messageCount = Math.ceil(formattedResponse.length / 2000);
      if(messageCount === 1) {
        await interaction.editReply(formattedResponse);
      } else {
        for (let i=0; i < messageCount; i++) {
          const currentIndex = i * 2000;
          const message = formattedResponse.slice(currentIndex, currentIndex + 2000 > formattedResponse.length ? undefined : currentIndex + 2000);
          if(i === 0) {
            await interaction.editReply(message);
          } else {
            await interaction.channel?.send(message);
          }
        }
      }
    } catch(error) {  
      console.log(error);
      await interaction.editReply(`Error prompting chatGPT`);
    }
  },
};