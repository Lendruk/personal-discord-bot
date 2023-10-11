import { Base, Message } from "discord.js";
import { DiscordEventHandler } from "../types/DiscordEventHandler";

type User = {
  id: string;
  chance: number;
  emojis: string[];
}
type ReactorResources = {
  users: User[];
}

const resources = await Bun.file('./resources/reactor.json').json<ReactorResources>();

const reactor: DiscordEventHandler = {
  event: 'messageCreate',
  handler: (message: Message) => {
    const { users } = resources;
    const user = users.find(user => user.id === message.author.id);
    if(user && Math.random() <= user.chance) {
      const { emojis } = user;
      message.react(emojis[Math.floor(Math.random() * (emojis.length - 0))]);
    }
  }
}

export default reactor;