import { Base, Message } from "discord.js";
import { DiscordEventHandler } from "../types/DiscordEventHandler";

type ReactorResources = {
  emojis: string[];
  users: string[];
}

const resources = await Bun.file('./resources/reactor.json').json<ReactorResources>();

const reactor: DiscordEventHandler = {
  event: 'messageCreate',
  handler: (message: Message) => {
    const { emojis, users } = resources;
    if(users.includes(message.author.id)) {
      message.react(emojis[Math.floor(Math.random() * (emojis.length - 0))]);
    }
  }
}

export default reactor;