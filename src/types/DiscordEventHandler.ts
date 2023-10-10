import { ClientEvents } from "discord.js"

export type DiscordEventHandler = {
  event: keyof ClientEvents,
  handler:  (payload: any) => void | Promise<void>
}