import {
  Client,
  GatewayIntentBits,
  Events,
  ChatInputCommandInteraction,
  VoiceState,
} from "discord.js";
import * as marry from "./commands/marry.js";
import * as room from "./commands/room.js";
import * as children from "./commands/children.js";
import * as nameChild from "./commands/nameChild.js";
import {
  incrementInteraction,
  findMarriage,
} from "./data.js";
import {
  trackRoomEntry,
  trackRoomExit,
  startChildCareLoop,
} from "./childSystem.js";
import { loadData, saveData, startAutoSave } from "./persistence.js";

loadData();

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN is not set!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot ready! Logged in as ${c.user.tag}`);
  startChildCareLoop(client);
  startAutoSave(30000);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const authorId = message.author.id;
  const guildId = message.guild.id;

  const channelMessages = await message.channel.messages.fetch({ limit: 10 }).catch(() => null);
  if (!channelMessages) return;

  const usersInChannel = new Set(
    channelMessages
      .filter((m) => !m.author.bot && m.author.id !== authorId)
      .map((m) => m.author.id)
  );

  for (const otherId of usersInChannel) {
    const count = incrementInteraction(authorId, otherId, guildId);
    if (count === 5) {
      const marriageAuthor = findMarriage(authorId, guildId);
      const marriageOther = findMarriage(otherId, guildId);
      if (!marriageAuthor && !marriageOther) {
        await message.channel.send(
          `💬 **${message.author.username}** và <@${otherId}> đã tương tác đủ **5 lần**!\n` +
            `💍 Dùng **/propose** để cầu hôn nhau!`
        );
      }
    }
  }

  const marriage = findMarriage(authorId, guildId);
  if (marriage && message.channelId === marriage.channelId) {
    trackRoomEntry(authorId, message.channelId, guildId, client);
  }
});

client.on(Events.VoiceStateUpdate, (oldState: VoiceState, newState: VoiceState) => {
  const userId = newState.member?.id;
  if (!userId) return;

  if (newState.channelId) {
    trackRoomEntry(userId, newState.channelId, newState.guild.id, client);
  }
  if (oldState.channelId) {
    trackRoomExit(userId, oldState.channelId);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction as ChatInputCommandInteraction;
  const name = cmd.commandName;

  const saveCmds = new Set([
    "accept_propose", "reject_propose", "divorce",
    "name_child", "feed", "sleep_baby", "comfort", "play", "heal", "future",
  ]);

  try {
    if (name === "propose") await marry.execute(cmd);
    else if (name === "accept_propose") await marry.acceptExecute(cmd);
    else if (name === "reject_propose") await marry.rejectExecute(cmd);
    else if (name === "rename_room") await room.renameExecute(cmd);
    else if (name === "divorce") await room.divorceExecute(cmd);
    else if (name === "marriage_status") await room.statusExecute(cmd);
    else if (name === "children") await children.childrenExecute(cmd);
    else if (name === "feed") await children.feedExecute(cmd);
    else if (name === "sleep_baby") await children.sleepBabyExecute(cmd);
    else if (name === "comfort") await children.comfortExecute(cmd);
    else if (name === "play") await children.playExecute(cmd);
    else if (name === "heal") await children.healExecute(cmd);
    else if (name === "future") await children.futureExecute(cmd);
    else if (name === "name_child") await nameChild.execute(cmd);

    if (saveCmds.has(name)) saveData();
  } catch (err) {
    console.error(`Error in /${name}:`, err);
    const msg = { content: "❌ Có lỗi xảy ra! Vui lòng thử lại.", ephemeral: true };
    if (cmd.deferred || cmd.replied) {
      await cmd.editReply(msg).catch(() => {});
    } else {
      await cmd.reply(msg).catch(() => {});
    }
  }
});

client.login(token);
