import { APIEmbedField, EmbedBuilder, RepliableInteraction, SlashCommandBuilder } from "discord.js";
import { CommandOptionsPayload, DiscordCommand } from "../types/DIscordCommand";
import { priceTracker } from "../services/PriceTrackerService";
import { VendorToString } from "../util/priceTracker";

export default {
  command: new SlashCommandBuilder()
  .setName("watch")
  .setDescription("watch a product for price updates")
  .addStringOption(builder => builder.setName("url").setDescription("the product url")),
  executor: async (interaction: RepliableInteraction) => {
    await interaction.deferReply();
    const data = (interaction as RepliableInteraction & CommandOptionsPayload).options.data;
    const url = data.find((payload) => payload.name === "url");
    if(!url || !url.value) {
      interaction.editReply("No url sent");
      return;
    }

    const vendorEntries = await priceTracker.watchProduct(url.value, interaction.user.id);
    const firstEntry = vendorEntries[0];

    const fields: APIEmbedField[] = [];
    for(const entry of vendorEntries) {
      fields.push({ name:`${VendorToString(entry.vendor)}`, value: `[${entry.price}€](${entry.url})`});
      // fields.push({ name: '\u200B', value: '\u200B' });
    }
    const embededProduct = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Watching - ${firstEntry.fullName} (${firstEntry.sku})`)
    .setDescription('---')
    .setThumbnail(firstEntry.productImageUrl)
    .addFields(
      fields
    )
    .setTimestamp()
    .setFooter({ text: 'Good' });


    interaction.editReply({ embeds: [embededProduct]});
  }
} as DiscordCommand