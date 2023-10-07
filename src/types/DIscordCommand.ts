import { Interaction, SlashCommandBuilder } from "discord.js"

export type CommandExecutor = (interaction: Interaction) => void | Promise<void>;

export type DiscordCommand = {
  command: SlashCommandBuilder,
  executor: CommandExecutor
}