import { RepliableInteraction, SlashCommandBuilder } from "discord.js";
import { CommandOptionsPayload, DiscordCommand } from "../types/DIscordCommand";
import { priceTracker } from "../services/PriceTrackerService";

export default {
  command: new SlashCommandBuilder()
  .setName("unwatch")
  .setDescription("Remove a product from the watchlist")
  .addStringOption(builder => builder.setName("sku").setDescription("The product SKU")),
  executor: async (interaction: RepliableInteraction) => {
    await interaction.deferReply();
    const data = (interaction as RepliableInteraction & CommandOptionsPayload).options.data;
    const sku = data.find((payload) => payload.name === "sku");
    if(!sku || !sku.value) {
      interaction.editReply("No sku sent");
      return;
    }

    try {
      await priceTracker.removeProductFromWatchlist(interaction.user.id, sku.value);
      interaction.editReply("Product removed successfully!");
    } catch(error) {
      interaction.editReply("Error removing product from watchlist");
    }
  }
} as DiscordCommand;