const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('차단')
        .setDescription('이 서버에서 해당 멤버를 차단합니다. (메시지 삭제 기능 포함)')
        .addUserOption(option => 
            option.setName('target')
            .setDescription('밴할 사용자를 선택하세요 (멘션 또는 ID)')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('사유')
            .setDescription('밴 이유를 입력하세요')
            .setRequired(false))
        .addStringOption(option =>
            option.setName('channels')
            .setDescription('메시지를 삭제할 채널 ID를 쉼표로 구분하여 입력하세요 (옵션)')
            .setRequired(false)),

    async execute(interaction) {
        // 상호작용 응답을 지연 처리
        await interaction.deferReply();

        const member = interaction.options.getUser('target');
        const reason = interaction.options.getString('사유') || '지정되지 않은 사유';
        const channelsInput = interaction.options.getString('channels');
        const specifiedChannels = channelsInput ? channelsInput.split(',').map(id => id.trim()) : [];

        // 관리자 권한 체크
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.editReply({ content: '당신은 이 명령어에 대한 권한이 없어요', ephemeral: true });
        }

        // 봇 권한 체크
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.editReply({ content: '봇이 권한이 없습니다', ephemeral: true });
        }

        // 서버에서 사용자 찾기
        const targetMember = interaction.guild.members.cache.get(member.id) || await interaction.guild.members.fetch(member.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply({
                content: `이 유저를 찾을 수 없습니다. 올바른 사용자 ID 또는 멘션을 입력했는지 확인해 주세요.`,
                ephemeral: true
            });
        }

        if (!targetMember.bannable) {
            return interaction.editReply({ content: '이 사용자는 차단할 수 없습니다. 모드/관리자이거나 가장 높은 역할이 저보다 높기 때문입니다', ephemeral: true });
        }

        if (targetMember.id === interaction.user.id) {
            return interaction.editReply({ content: '본인을 차단할 수 없습니다.', ephemeral: true });
        }
        const loademoji = interaction.emojis.cache.get('1331981348033794048')
        const doneemoji = interaction.emojis.cache.get('1331979067230126082')
        // 초기 임베드
        let embed = new EmbedBuilder()
            .setColor('#ffcc00')
            .setTitle(`${loademoji} 메시지 삭제 작업 진행 중..`)
            .setDescription('작업을 진행 중입니다. 잠시만 기다려 주세요.');

        // 초기 응답 임베드 전송
        const reply = await interaction.editReply({ embeds: [embed], fetchReply: true });

        // 15일 이내 메시지 삭제
        const { deletedCount, undeletableCount, undeletableMessages } = await deleteUserMessages(targetMember, reply, specifiedChannels);

        // 최종 응답
        embed = new EmbedBuilder()
            .setColor('#e21717')
            .setTitle(`${doneemoji} 메시지 삭제 작업 완료`)
            .setDescription(`제거된 메시지: ${deletedCount}개\n실패한 메시지: ${undeletableCount}개\n${undeletableMessages.length > 0 ? `메시지 ID: ${undeletableMessages.join(', ')}` : ''}`);

        try {
            await targetMember.ban({ reason });

            const banEmbed = new EmbedBuilder()
                .setColor('#b906ec')
                .setTitle('한 유저가 서버에서 차단 되었음을 알려드립니다.')
                .setThumbnail(targetMember.user.displayAvatarURL())
                .addFields(
                    { name: '차단된 사용자', value: targetMember.user.globalName + `(\`${targetMember.user.id}\`)` },
                    { name: '차단한 관리자', value: interaction.user.tag },
                    { name: '차단된 이유', value: reason }
                )
                .setFooter({ text: '차단된 시간', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await reply.edit({ embeds: [embed] });
            const logChannel = interaction.client.channels.cache.get('punishment_channel');
            if (logChannel) {
                logChannel.send({ embeds: [banEmbed] });
            }
        } catch (err) {
            console.error('차단 중 오류 발생:', err);
            embed.setColor('#ff0000').setDescription('차단 중 오류가 발생했습니다.');
            await reply.edit({ embeds: [embed] });
            return;
        }
    }
};

// 사용자 메시지 삭제 함수
async function deleteUserMessages(member, reply, specifiedChannels) {
    const now = Date.now();
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000; // 15일 전의 타임스탬프

    let channels = member.guild.channels.cache.filter(channel => channel.isTextBased());
    if (specifiedChannels.length > 0) {
        channels = channels.filter(channel => specifiedChannels.includes(channel.id));
    }

    let deletedCount = 0;
    let undeletableCount = 0;
    let undeletableMessages = [];
    let startTime = Date.now();

    for (const channel of channels.values()) {
        let lastMessageId;
        let fetchedMessages;

        do {
            fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
            lastMessageId = fetchedMessages.last()?.id;

            for (const msg of fetchedMessages.values()) {
                if (msg.author.id === member.id) {
                    if (msg.createdTimestamp > fifteenDaysAgo) {
                        try {
                            await msg.delete();
                            deletedCount++;
                        } catch (err) {
                            console.error('메시지 삭제 중 오류 발생:', err);
                        }
                    } else {
                        undeletableMessages.push(msg.id); // 삭제할 수 없는 메시지 ID 기록
                        undeletableCount++;
                    }

                    // 실시간 업데이트
                    let elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                    let updateEmbed = new EmbedBuilder()
                        .setColor('#ffcc00')
                        .setTitle(`${loademoji} 메시지 삭제 작업 진행 중...`)
                        .setDescription(`${elapsedTime}초 지남: \n# ${deletedCount}개 메시지 발견하고 제거했습니다.`);

                    await reply.edit({ embeds: [updateEmbed] });
                }
            }
        } while (fetchedMessages.size >= 100);
    }

    return { deletedCount, undeletableCount, undeletableMessages };
}
