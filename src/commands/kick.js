const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('킥')
        .setDescription('서버에서 사용자를 추방합니다.')
        .addUserOption(option =>
            option.setName('사용자')
                .setDescription('추방할 사용자를 선택하세요.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('사유')
                .setDescription('추방 사유를 입력하세요.')
                .setRequired(false)),

    async execute(interaction) {
        // 권한 체크
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: '이 명령어를 사용할 권한이 없습니다.', ephemeral: true });
        }
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: '봇에게 필요한 권한이 없습니다.', ephemeral: true });
        }

        // 사용자 및 사유 가져오기
        const member = interaction.options.getMember('사용자');
        const reason = interaction.options.getString('사유') || '지정되지 않은 사유';

        if (!member) {
            return interaction.reply({ content: '이 사용자를 찾을 수 없습니다.', ephemeral: true });
        }
        if (!member.kickable) {
            return interaction.reply({ content: '이 사용자를 추방할 수 없습니다. 해당 사용자가 관리자이거나 역할 우선순위가 높습니다.', ephemeral: true });
        }
        if (member.id === interaction.user.id) {
            return interaction.reply({ content: '자신을 추방할 수 없습니다.', ephemeral: true });
        }

        try {
            await member.kick(reason);

            // 명령어 호출자에게 응답
            const successEmbed = new EmbedBuilder()
                .setColor('#e21717')
                .setTitle('추방 기능 정상 작동')
                .setDescription(`${member}님이 서버에서 추방되었습니다. 처벌 기록 채널로 메시지가 전송되었습니다.`);
            await interaction.reply({ embeds: [successEmbed] });

            // 처벌 기록 채널에 로그 전송
            const kickEmbed = new EmbedBuilder()
                .setColor('#b906ec')
                .setTitle('서버에서 유저가 추방되었습니다.')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: '추방된 사용자', value: `${member}` },
                    { name: '추방된 사용자 ID', value: member.user.id },
                    { name: '추방한 관리자', value: `<@${interaction.user.id}>` },
                    { name: '추방 사유', value: reason }
                )
                .setFooter({ text: '추방된 시간', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            const logChannel = interaction.client.channels.cache.get('827450348184666122'); // 로그 채널 ID
            if (logChannel) {
                await logChannel.send({ embeds: [kickEmbed] });
            }
        } catch (error) {
            console.error('사용자 추방 중 오류 발생:', error);
            return interaction.reply({ content: '사용자 추방 중 오류가 발생했습니다.', ephemeral: true });
        }
    },
};
