import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
  TextChannel,
} from "discord.js";
import {
  marriages,
  pendingProposals,
  getMarriageKey,
  findMarriage,
  getInteractionCount,
} from "../data.js";

export const data = new SlashCommandBuilder()
  .setName("propose")
  .setDescription("💍 Cầu hôn một người dùng khác")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("Người bạn muốn cầu hôn").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const proposer = interaction.user;
  const target = interaction.options.getUser("user", true);
  const guildId = interaction.guildId!;

  if (target.id === proposer.id) {
    await interaction.editReply("❌ Bạn không thể cầu hôn chính mình!");
    return;
  }

  if (target.bot) {
    await interaction.editReply("❌ Bạn không thể cầu hôn một bot!");
    return;
  }

  const proposerMarriage = findMarriage(proposer.id, guildId);
  if (proposerMarriage) {
    await interaction.editReply("❌ Bạn đã kết hôn rồi! Hãy dùng `/divorce` trước.");
    return;
  }

  const targetMarriage = findMarriage(target.id, guildId);
  if (targetMarriage) {
    await interaction.editReply(`❌ ${target.username} đã kết hôn rồi!`);
    return;
  }

  const existingKey = `${guildId}-${proposer.id}-${target.id}`;
  const reverseKey = `${guildId}-${target.id}-${proposer.id}`;
  if (pendingProposals.has(existingKey) || pendingProposals.has(reverseKey)) {
    await interaction.editReply("❌ Đã có lời cầu hôn đang chờ giữa hai người!");
    return;
  }

  const interactions = getInteractionCount(proposer.id, target.id, guildId);
  if (interactions < 5) {
    const remaining = 5 - interactions;
    await interaction.editReply(
      `💬 Bạn cần tương tác thêm **${remaining} lần** với ${target.username} trước khi cầu hôn!\n` +
        `_(Hiện tại: ${interactions}/5 tin nhắn)_`
    );
    return;
  }

  pendingProposals.set(existingKey, {
    from: proposer.id,
    to: target.id,
    guildId,
    timestamp: Date.now(),
  });

  setTimeout(() => {
    pendingProposals.delete(existingKey);
  }, 60000);

  await interaction.editReply(
    `💍 **${proposer.username}** đã cầu hôn **${target.username}**!\n\n` +
      `${target}, hãy dùng lệnh **/accept_propose** để chấp nhận hoặc **/reject_propose** để từ chối.\n` +
      `_(Lời cầu hôn sẽ hết hạn sau 60 giây)_`
  );
}

export const acceptData = new SlashCommandBuilder()
  .setName("accept_propose")
  .setDescription("💒 Chấp nhận lời cầu hôn");

export async function acceptExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = interaction.user;
  const guildId = interaction.guildId!;
  const guild = interaction.guild!;

  let proposalKey: string | null = null;
  let proposal: { from: string; to: string; guildId: string; timestamp: number } | null = null;

  for (const [key, p] of pendingProposals.entries()) {
    if (p.to === user.id && p.guildId === guildId) {
      proposalKey = key;
      proposal = p;
      break;
    }
  }

  if (!proposalKey || !proposal) {
    await interaction.editReply("❌ Không có lời cầu hôn nào dành cho bạn!");
    return;
  }

  pendingProposals.delete(proposalKey);

  const proposer = await guild.members.fetch(proposal.from);
  const bride = await guild.members.fetch(user.id);

  const channelName = `💑-${proposer.user.username}-và-${user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);

  let privateChannel: TextChannel | null = null;

  try {
    const everyoneRole = guild.roles.everyone;
    privateChannel = (await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: everyoneRole.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: proposer.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
        {
          id: bride.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
      ],
    })) as TextChannel;
  } catch {
    await interaction.editReply("❌ Bot không có quyền tạo kênh! Hãy cấp quyền Manage Channels.");
    return;
  }

  const marriageKey = getMarriageKey(proposal.from, user.id);
  marriages.set(marriageKey, {
    partner1: proposal.from,
    partner2: user.id,
    guildId,
    channelId: privateChannel.id,
    channelName: privateChannel.name,
    marriedAt: Date.now(),
    roomEnteredAt: null,
    children: [],
  });

  await privateChannel.send(
    `🎊 **Chào mừng đến phòng riêng của hai bạn!**\n\n` +
      `💑 **${proposer.user.username}** ❤️ **${user.username}**\n\n` +
      `🏠 Khi cả hai cùng nhắn tin trong phòng này liên tục trong **2 phút**, bạn sẽ có con!\n` +
      `📌 Dùng **/rename_room [tên]** để đặt tên phòng\n` +
      `👶 Dùng **/children** để xem thông tin con cái\n` +
      `🍼 Các lệnh chăm sóc: /feed /sleep_baby /comfort /play /heal`
  );

  await interaction.editReply(
    `💒 **${proposer.user.username}** và **${user.username}** đã kết hôn!\n\n` +
      `🏠 Phòng riêng: ${privateChannel}\n\n` +
      `🎉 Chúc mừng hạnh phúc!`
  );
}

export const rejectData = new SlashCommandBuilder()
  .setName("reject_propose")
  .setDescription("💔 Từ chối lời cầu hôn");

export async function rejectExecute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const user = interaction.user;
  const guildId = interaction.guildId!;

  let proposalKey: string | null = null;
  let proposal: { from: string } | null = null;

  for (const [key, p] of pendingProposals.entries()) {
    if (p.to === user.id && p.guildId === guildId) {
      proposalKey = key;
      proposal = p;
      break;
    }
  }

  if (!proposalKey || !proposal) {
    await interaction.editReply("❌ Không có lời cầu hôn nào dành cho bạn!");
    return;
  }

  pendingProposals.delete(proposalKey);

  const proposer = await interaction.guild!.members.fetch(proposal.from);
  await interaction.editReply(
    `💔 **${user.username}** đã từ chối lời cầu hôn của **${proposer.user.username}**.`
  );
}
