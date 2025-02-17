const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 경고 파일 경로
const warningsFilePath = path.join(__dirname, '..', 'warnings.json');

// 경고 데이터를 파일에서 불러오기
let warnings = {};
function loadWarnings() {
    if (fs.existsSync(warningsFilePath)) {
        warnings = JSON.parse(fs.readFileSync(warningsFilePath, 'utf-8'));
    } else {
        warnings = {};
    }
}

// 경고 데이터를 파일에 저장하는 함수
function saveWarnings() {
    fs.writeFileSync(warningsFilePath, JSON.stringify(warnings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('경고')
        .setDescription('유저에게 경고를 발부합니다.')
        .addUserOption(option => option.setName('유저').setDescription('경고할 유저를 선택하세요.').setRequired(true))
        .addStringOption(option => option.setName('사유').setDescription('경고 사유를 입력하세요.').setRequired(false)),

    async execute(interaction) {
        // 관리자 권한이 있는지 확인
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '경고 명령어를 사용할 권한이 없습니다.', ephemeral: true });
        }

        // 유저와 사유 옵션 추출
        const user = interaction.options.getUser('유저');
        const reason = interaction.options.getString('사유') || '사유 없음';

        // 봇을 대상으로 경고 명령어를 사용할 수 없게 설정
        if (user.bot) {
            return interaction.reply({ content: '봇에게는 경고를 부여할 수 없습니다.', ephemeral: true });
        }

        // 서버에서 유저 객체를 가져오기
        const guildMember = interaction.guild.members.cache.get(user.id);

        // 유저가 관리자 권한을 가진 경우 경고를 부여할 수 없도록 설정
        if (guildMember && guildMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '관리자에게는 경고를 부여할 수 없습니다.', ephemeral: true });
        }

        // 경고 데이터 리로드
        loadWarnings();

        // 경고 데이터 확인 및 업데이트
        if (!warnings[user.id]) {
            warnings[user.id] = { count: 0, reasons: [] };
        }

        // 경고 추가
        warnings[user.id].count += 1;
        warnings[user.id].reasons.push(reason);

        // 경고 데이터를 파일에 저장
        saveWarnings();

        // 경고 횟수 확인
        const warningCount = warnings[user.id].count;

        // 임베드 메시지로 경고 알림 (프로필 사진 추가)
        const embed = new EmbedBuilder()
            .setColor('#e21717')
            .setTitle('⚠️ 경고 추가 알림')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setDescription(`경고 1회가 추가 되었습니다.`)
            .addFields(
                { name: '경고 부여자', value: `<@${interaction.user.id}>` },
                { name: '경고 대상', value: `<@${user.id}>` },
                { name: '경고 횟수', value: `${warningCount}개` },
                { name: '경고 사유', value: reason }
            )
            .setFooter({ text: '경고 부여된 시간', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // 특정 채널 ID를 설정하세요
        const CHANNEL_ID = process.env.Warn_Logchannel; // 실제 채널 ID로 변경하세요
        const channel = interaction.client.channels.cache.get(CHANNEL_ID);

        if (channel) {
            try {
                await channel.send({ embeds: [embed] });
                await interaction.reply({ content: '경고 메시지가 전송되었습니다.', ephemeral: true });
            } catch (error) {
                console.error('임베드 메시지를 전송하는 도중 문제가 발생했습니다:', error);
                await interaction.reply({ content: '임베드 메시지를 전송하는 도중 문제가 발생했습니다.', ephemeral: true });
            }
        } else {
            await interaction.reply({ content: '지정된 채널을 찾을 수 없습니다.', ephemeral: true });
        }

        // 경고 횟수가 5회 이상일 때, 특정 채널에 경고 누적 메시지 전송
        if (warningCount >= 5) {
            const warningEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('⚠️ 경고 누적 알림')
                .setDescription(`<@${user.id}> 님의 경고가 5회 누적되었습니다.\n해당 유저에 대한 조치가 필요합니다.`)
                .addFields(
                    { name: '경고 횟수', value: `${warningCount}회` },
                    { name: '경고 사유 목록', value: warnings[user.id].reasons.join('\n') }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: '경고 누적 경고', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            // 경고 누적 메시지를 전송할 채널 ID
            const ALERT_CHANNEL_ID = '952284021533048892'; // 경고 누적 메시지를 보낼 채널 ID로 변경하세요
            const alertChannel = interaction.client.channels.cache.get(ALERT_CHANNEL_ID);

            if (alertChannel) {
                try {
                    await alertChannel.send({ embeds: [warningEmbed] });
                    await interaction.followUp({ content: '경고 누적 메시지가 전송되었습니다.', ephemeral: true });
                } catch (error) {
                    console.error('경고 누적 메시지를 전송하는 도중 문제가 발생했습니다:', error);
                    await interaction.followUp({ content: '경고 누적 메시지를 전송하는 도중 문제가 발생했습니다.', ephemeral: true });
                }
            } else {
                await interaction.followUp({ content: '경고 누적 메시지를 전송할 채널을 찾을 수 없습니다.', ephemeral: true });
            }
        }
    }
};
