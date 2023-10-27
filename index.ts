import { Client, GatewayIntentBits, REST, Routes, Events, ClientEvents } from 'discord.js';
import { readdir } from 'fs/promises';
import { CommandExecutor, DiscordCommand } from './src/types/DIscordCommand';
import { DiscordEventHandler } from './src/types/DiscordEventHandler';
import { priceTracker } from './src/services/PriceTrackerService';
import { initRest } from './src/rest/rest';
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });

(async () => {
  let commandActions: { [index: string]:  CommandExecutor} = {};

  client.on('ready', () => {
    console.log(`Logged in as ${client!.user!.tag}!`);
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if(commandActions[interaction.commandName]) {
      await commandActions[interaction.commandName](interaction);
    }
  });

  await client.login(Bun.env.DISCORD_TOKEN);
  const rest = new REST().setToken(Bun.env.DISCORD_TOKEN ?? '');

  // Register Event handlers
  try {
    const files = (await readdir('./src/eventHandlers')).map(file => file.replace('.ts', ''));

    for(const file of files) {
      const eventHandler = (await import(`./src/eventHandlers/${file}`)).default as DiscordEventHandler;
      client.on(eventHandler.event as string, eventHandler.handler);
    }
  } catch(error) {
		console.error(`Error registering event handlers: ${error}`);
  }

  // Register Commands
	try {
    const files = (await readdir('./src/commands')).map(file => file.replace('.ts', ''));
    let commands = [];
    for(const file of files) {
      const command = (await import(`./src/commands/${file}`)).default as DiscordCommand;
      commands.push(command.command.toJSON());

      commandActions[command.command.name] = command.executor;
    }
  
		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
			Routes.applicationCommands(Bun.env.DISCORD_CLIENT_ID ?? ''),
			{ 
        body: commands,
      },
		);

	} catch (error) {
		console.error(`Error registering commands: ${error}`);
	}

  await priceTracker.init(client);
  initRest();
})();