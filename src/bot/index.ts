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

  try {
    if (name === "propose") return await marry.execute(cmd);
    if (name === "accept_propose") return await marry.acceptExecute(cmd);
    if (name === "reject_propose") return await marry.rejectExecute(cmd);
    if (name === "rename_room") return await room.renameExecute(cmd);
    if (name === "divorce") return await room.divorceExecute(cmd);
    if (name === "marriage_status") return await room.statusExecute(cmd);
    if (name === "children") return await children.childrenExecute(cmd);
    if (name === "feed") return await children.feedExecute(cmd);
    if (name === "sleep_baby") return await children.sleepBabyExecute(cmd);
    if (name === "comfort") return await children.comfortExecute(cmd);
    if (name === "play") return await children.playExecute(cmd);
    if (name === "heal") return await children.healExecute(cmd);
    if (name === "future") return await children.futureExecute(cmd);
    if (name === "name_child") return await nameChild.execute(cmd);
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
