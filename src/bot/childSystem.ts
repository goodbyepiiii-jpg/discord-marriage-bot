import { Client, TextChannel } from "discord.js";
import {
  marriages,
  roomOccupancy,
  childNeeds,
  childMilestones,
  Child,
  Marriage,
  getMarriageKey,
} from "./data.js";

function generateChildId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function trackRoomEntry(
  userId: string,
  channelId: string,
  guildId: string,
  client: Client
) {
  for (const marriage of marriages.values()) {
    if (marriage.channelId === channelId && marriage.guildId === guildId) {
      if (!roomOccupancy.has(channelId)) {
        roomOccupancy.set(channelId, new Set());
      }
      roomOccupancy.get(channelId)!.add(userId);

      const occupants = roomOccupancy.get(channelId)!;
      const bothIn =
        occupants.has(marriage.partner1) && occupants.has(marriage.partner2);

      if (bothIn && !marriage.roomEnteredAt) {
        marriage.roomEnteredAt = Date.now();
        setTimeout(() => checkForChild(marriage, client), 2 * 60 * 1000);
      }
      return;
    }
  }
}

export function trackRoomExit(userId: string, channelId: string) {
  if (roomOccupancy.has(channelId)) {
    roomOccupancy.get(channelId)!.delete(userId);
  }

  for (const marriage of marriages.values()) {
    if (marriage.channelId === channelId) {
      const occupants = roomOccupancy.get(channelId) ?? new Set();
      const bothIn =
        occupants.has(marriage.partner1) && occupants.has(marriage.partner2);
      if (!bothIn) {
        marriage.roomEnteredAt = null;
      }
    }
  }
}

async function checkForChild(marriage: Marriage, client: Client) {
  if (!marriage.roomEnteredAt) return;

  const key = getMarriageKey(marriage.partner1, marriage.partner2);
  const stored = marriages.get(key);
  if (!stored) return;

  const occupants = roomOccupancy.get(marriage.channelId) ?? new Set();
  const bothStillIn =
    occupants.has(marriage.partner1) && occupants.has(marriage.partner2);

  if (!bothStillIn) {
    marriage.roomEnteredAt = null;
    return;
  }

  marriage.roomEnteredAt = null;

  const guild = client.guilds.cache.get(marriage.guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(marriage.channelId) as TextChannel | undefined;
  if (!channel) return;

  await channel.send(
    `🎊 **Chúc mừng!** Hai bạn đã ở cùng nhau đủ lâu...\n\n` +
      `👶 Một em bé sắp chào đời! Hãy đặt tên cho bé bằng lệnh **/name_child [tên]**`
  );
}

export function startChildCareLoop(client: Client) {
  setInterval(() => {
    for (const marriage of marriages.values()) {
      for (const child of marriage.children) {
        const now = Date.now();

        if (now - child.lastNotify < 3 * 60 * 1000) continue;

        child.hunger = Math.max(0, child.hunger - 5);
        child.sleep = Math.max(0, child.sleep - 3);
        child.happiness = Math.max(0, child.happiness - 2);

        child.age = Math.floor((now - child.born) / (1000 * 60 * 10));

        const milestone = childMilestones[child.age];
        if (milestone) {
          sendChildNotification(client, marriage, child, milestone);
          child.lastNotify = now;
          continue;
        }

        const needsAttention = child.hunger < 30 || child.sleep < 30 || child.happiness < 30;
        if (needsAttention) {
          const lowStats: string[] = [];
          if (child.hunger < 30) lowStats.push("🍔 đói");
          if (child.sleep < 30) lowStats.push("😴 buồn ngủ");
          if (child.happiness < 30) lowStats.push("😢 buồn");

          const randomNeed = childNeeds[Math.floor(Math.random() * childNeeds.length)];
          sendChildNotification(
            client,
            marriage,
            child,
            `${randomNeed.message}\n_(${lowStats.join(", ")})_\nDùng \`${randomNeed.command}\` để giúp bé!`
          );
          child.lastNotify = now;
        }
      }
    }
  }, 60 * 1000);
}

async function sendChildNotification(
  client: Client,
  marriage: Marriage,
  child: Child,
  message: string
) {
  const guild = client.guilds.cache.get(marriage.guildId);
  if (!guild) return;
  const channel = guild.channels.cache.get(marriage.channelId) as TextChannel | undefined;
  if (!channel) return;

  await channel
    .send(
      `<@${marriage.partner1}> <@${marriage.partner2}>\n` +
        `👶 **${child.name}** ${message}`
    )
    .catch(() => {});
}

export function nameChild(
  userId: string,
  guildId: string,
  name: string
): { success: boolean; message: string } {
  for (const marriage of marriages.values()) {
    if (
      marriage.guildId === guildId &&
      (marriage.partner1 === userId || marriage.partner2 === userId)
    ) {
      const newChild: Child = {
        id: generateChildId(),
        name,
        parents: [marriage.partner1, marriage.partner2],
        guildId,
        born: Date.now(),
        age: 0,
        hunger: 80,
        sleep: 80,
        happiness: 100,
        future: [],
        lastNotify: 0,
        traits: [],
      };
      marriage.children.push(newChild);
      return { success: true, message: `👶 Chào mừng **${name}** đến với thế giới!` };
    }
  }
  return { success: false, message: "❌ Bạn chưa kết hôn!" };
}
