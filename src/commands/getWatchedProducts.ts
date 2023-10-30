import { RepliableInteraction, SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "../types/DIscordCommand";
import { priceTracker } from "../services/PriceTrackerService";
import { VendorToString } from "../util/priceTracker";

export default {
  command: new SlashCommandBuilder()
  .setName("get-watchlist")
  .setDescription("Get all products currently in watchlist"),
  executor: async (interaction: RepliableInteraction) => {
    await interaction.deferReply();

    const products = await priceTracker.getUserWatchlist(interaction.user.id);

    if(products.length) {
      let result = "";
      for(const product of products) {
        const name = product.vendorEntries[0].fullName;
        result += `${name} - ${product.sku} \nVendors: \n`;
        for(const entry of product.vendorEntries) {
          result += `[${VendorToString(entry.vendor)}](<${entry.url}>) - Last price: ${entry.price}€ - Updated At: ${new Date(entry.lastUpdated * 1000).toDateString()} \n`;
        }
      }
  
      interaction.editReply(result);
    } else {
      interaction.editReply("No products currently in watchlist");
    }
  }
} as DiscordCommand;