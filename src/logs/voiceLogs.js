// logs/voiceLogs.js
const { EmbedBuilder } = require('discord.js');

// 로그를 전송할 채널 ID와 특정 서버 ID 설정
const voiceLogChannelId = "1331965454079623220"
const targetGuildId = process.env.guildId;

module.exports = function(client) {
    // 유저가 음성 채널에 접속할 때의 로그
    client.on('voiceStateUpdate', (oldState, newState) => {
        // 봇 또는 DM 채널의 변화는 무시
        if (newState.member.user.bot) return;

        // 서버가 특정 서버가 아닌 경우 반환
        if (newState.guild.id !== targetGuildId) return;

        const logChannel = client.channels.cache.get(voiceLogChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;

        const user = newState.member.user;
        const timestamp = new Date().toLocaleString();

        // 유저가 음성 채널에 접속한 경우
        if (!oldState.channelId && newState.channelId) {
            const embed = new EmbedBuilder()
                .setTitle('📥 유저 음성 채널 접속 로그')
                .setColor('#00FF00')
                .setDescription(`<@${user.id}> (${user.tag}) 이(가) **${newState.channel.name}** 채널에 접속했습니다.`)
                .addFields(
                    { name: '> **채널**', value: `<#${newState.channel.id}> (${newState.channel.id})` },  // 음성 채널 멘션 및 ID
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))  // 사용자 프로필 이미지 추가
                .setFooter({ text: '음성 채널에 접속했습니다.' })  // 푸터 메시지
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }

        // 유저가 음성 채널에서 나간 경우
        if (oldState.channelId && !newState.channelId) {
            const embed = new EmbedBuilder()
                .setTitle('📤 유저 음성 채널 나감 로그')
                .setColor('#FF0000')
                .setDescription(`<@${user.id}> (${user.tag}) 이(가) **${oldState.channel.name}** 채널에서 나갔습니다.`)
                .addFields(
                    { name: '> **채널**', value: `<#${oldState.channel.id}> (${oldState.channel.id})` },  // 음성 채널 멘션 및 ID
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))  // 사용자 프로필 이미지 추가
                .setFooter({ text: '음성 채널에서 나갔습니다.' })  // 푸터 메시지
                .setTimestamp();

            logChannel.send({ embeds: [embed] });
        }
    });
};
