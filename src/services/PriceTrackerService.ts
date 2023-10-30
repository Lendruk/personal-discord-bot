import { env } from "bun"
import { APIEmbedField, Client, EmbedBuilder, strikethrough } from "discord.js"
import { VendorToString } from "../util/priceTracker"

type User = {
  priceTrackerId: number,
  discordId: string
}

type ProductHistory = {
  id: number,
  vendorEntryId: number,
  price: number,
  availability: number,
  updatedAt: number,
}

export type Product = {
  id: number,
  sku: string,
  vendorEntries: VendorEntry[],
  watchers: number[]
};

export enum Vendor {
  GLOBAL_DATA,
  PCDIGA
}

export type VendorEntry = {
  id: number,
  universalId: number,
  price: number,
  url: string,
  vendor: Vendor,
  sku: string,
  fullName: string,
  productImageUrl: string,
  lastUpdated: number,
  availability: number,
  history: ProductHistory[],
}

export type ProductUpdatePayload = { [index:string]: Product };

class PriceTrackerService {
  private static USERS_FILE = './resources/price_tracker_users.json'
  private static HOOK_URL = 'http://localhost:3000/price-tracker';

  private discordClient?: Client;

  public async init(discordClient: Client): Promise<void> {
    await fetch(`${process.env.PRICE_TRACKER_URL as string}/webhooks`, {
      method: 'POST',
      body: JSON.stringify({ hook: PriceTrackerService.HOOK_URL })
    });

    if(!(await Bun.file(PriceTrackerService.USERS_FILE).exists())) {
      await Bun.write(PriceTrackerService.USERS_FILE, JSON.stringify([]));
    }

    this.discordClient = discordClient;
  }

  public async watchProduct(url: string, discordId: string): Promise<VendorEntry[]> {
    // If user is not registered yet register the user
    let user = await this.getUser(discordId);

    if(!user) {
      user = await this.createUser(discordId);
    }


    // then watch the product
    const result = await fetch(`${process.env.PRICE_TRACKER_URL as string}/webhooks/products`, {
      method: 'POST',
      body: JSON.stringify({ user: user.priceTrackerId, url, hook: PriceTrackerService.HOOK_URL })
    });

    const parsedBody = await result.json();

    if(result.status === 400) {
      throw new Error(`Vendor not supported by price tracker`);
    } else if(result.status > 400) {
      throw new Error(`Price tracker internal error`);
    }

    return parsedBody as VendorEntry[];
  }

  public async getUserWatchlist(discordId: string): Promise<Product[]> {
    const user  = await this.getUser(discordId);

    let products: Product[] = [];
    if(user) {
      const response = await fetch(`${process.env.PRICE_TRACKER_URL as string}/users/${user.priceTrackerId}/watchlist`);
      const parsedBody = await response.json();
      products = parsedBody as Product[];
    }

    return products;
  }

  public async removeProductFromWatchlist(discordId: string, productSKU: string): Promise<void> {
    const user = await this.getUser(discordId);
    const response = await fetch(`${process.env.PRICE_TRACKER_URL as string}/users/${user?.priceTrackerId}/watchlist/${productSKU}`, { method: 'DELETE' });

    if(response.status > 200) {
      throw new Error("Error removing product from watchlist");
    }
  }

  public async getUser(discordId: string): Promise<User | undefined> {
    const resources = await Bun.file(PriceTrackerService.USERS_FILE).json<User[]>();

    const user = resources.find(usr => usr.discordId === discordId);

    return user;
  }

  public async getUserByTrackerId(trackerId: number): Promise<User> {
    const resources = await Bun.file(PriceTrackerService.USERS_FILE).json<User[]>();

    const user = resources.find(usr => usr.priceTrackerId === trackerId);

    return user!;
  }

  public async createUser(discordId: string): Promise<User> {
    const response = await fetch(`${process.env.PRICE_TRACKER_URL as string}/webhooks/users`, {
      method: 'POST',
      body: JSON.stringify({ hook: PriceTrackerService.HOOK_URL })
    });

    const parsedBody = await response.json();

    const newUser: User = { discordId, priceTrackerId: parsedBody['id']}

    const resources = await Bun.file(PriceTrackerService.USERS_FILE).json<User[]>();
    resources.push(newUser);

    await Bun.write(Bun.file(PriceTrackerService.USERS_FILE), JSON.stringify(resources));

    return newUser;
  }

  public async handleProductUpdate(products: ProductUpdatePayload) {
    for(const product of Object.values(products))  {
      for(const watcher of product.watchers) {
        const user = await this.getUserByTrackerId(watcher);
        const discordUser =await this.discordClient?.users.fetch(user.discordId)
        
        if(discordUser) {
          const fields: APIEmbedField[] = [];
          const firstEntry = product.vendorEntries[0];
          for(const entry of product.vendorEntries) {
            fields.push({ name:`${VendorToString(entry.vendor)}`, value: this.formatEntryPrice(entry)});
            // fields.push({ name: '\u200B', value: '\u200B' });
          }

          const embededProduct = new EmbedBuilder()
          .setColor(0x0099FF)
          .setTitle(`🚨 UPDATE 🚨 - ${firstEntry.fullName} (${product.sku})`)
          .setDescription('---')
          .setThumbnail(firstEntry.productImageUrl)
          .addFields(
            fields
          )
          .setTimestamp()
          // .setFooter({ text: 'Good' });

          discordUser.send({ embeds: [embededProduct]});
        }
      }
    }

  }

  private formatEntryPrice(entry: VendorEntry): string {
    
    return entry.history.length > 0 ? `New: [${entry.price}€](${entry.url}) Old: ${strikethrough(entry.history[entry.history.length - 1].price.toString()+"€")}` : `[${entry.price}€](${entry.url})`;
  }

}


export const priceTracker = new PriceTrackerService();