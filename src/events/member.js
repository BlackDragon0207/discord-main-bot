const { EmbedBuilder } = require('discord.js');

const guildId = process.env.guildId; // 서버 ID
const channelJoin = process.env.Join_channel; // 환영 메시지 전송 채널 ID
const channelLeft = process.env.Left_channel; // 퇴장 메시지 전송 채널 ID
const logChannelId = process.env.logChannelId; // "입퇴장 로그" 채널 ID



module.exports = (client) => {
    client.on('guildMemberAdd', member => {
        console.log('[Event] guildMemberAdd 이벤트가 작동했습니다');

        if (member.guild.id !== guildId) {
            console.log('다른 서버에서 발생한 입장 이벤트입니다. 무시합니다.');
            return;
        }

        // 유저 입장 환영 메시지 전송
        const okEmoji = client.emojis.cache.get('1331984243064049685');
        const welcomeMessage = `${okEmoji} ${member} 님께서 서버에 접속하셨습니다.`; // 일반 메시지로 변경
        
        const joinChannel = client.channels.cache.get(channelJoin);
        if (joinChannel) {
            joinChannel.send(welcomeMessage); // Embed 대신 일반 메시지 전송
        } else {
            console.log('환영 채널을 찾을 수 없습니다. 채널ID를 다시 확인해주세요.');
        }
        

        // "입퇴장 로그" 채널에 입장 로그 전송
        const logEmbed = new EmbedBuilder()
            .setTitle('📥 멤버 입장')
            .setDescription(`${member} 님이 서버에 입장하셨습니다.`)
            .addFields(
                { name: '유저 태그', value: member.user.tag, inline: true },
                { name: '유저 ID', value: member.id, inline: true },
                { name: '입장 시간', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor("#00ff23");

        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send({ embeds: [logEmbed] });
        } else {
            console.log('입퇴장 로그 채널을 찾을 수 없습니다. 채널ID를 다시 확인해주세요.');
        }
    });

    client.on('guildMemberRemove', member => {
        console.log('[Event] guildMemberRemove 이벤트가 작동했습니다');

        if (member.guild.id !== guildId) {
            console.log('다른 서버에서 발생한 퇴장 이벤트입니다. 무시합니다.');
            return;
        }

        // 유저 퇴장 메시지 전송
        const noEmoji = client.emojis.cache.get('1331985499669401631');
        const goodbyeEmbed = new EmbedBuilder()
            .setDescription(`${noEmoji} ${member} 님께서 서버에서 나가셨습니다.`)
            .setColor("#ff0606");

        const leftChannel = client.channels.cache.get(channelLeft);
        if (leftChannel) {
            leftChannel.send({ embeds: [goodbyeEmbed] });
        } else {
            console.log('퇴장 채널을 찾을 수 없습니다. 채널ID를 다시 확인해주세요.');
        }

        // "입퇴장 로그" 채널에 퇴장 로그 전송
        const logEmbed = new EmbedBuilder()
            .setTitle('📤 멤버 퇴장')
            .setDescription(`${member} 님이 서버에서 나가셨습니다.`)
            .addFields(
                { name: '유저 태그', value: member.user.tag, inline: true },
                { name: '유저 ID', value: member.id, inline: true },
                { name: '퇴장 시간', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setColor("#ff0606");

        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send({ embeds: [logEmbed] });
        } else {
            console.log('입퇴장 로그 채널을 찾을 수 없습니다. 채널ID를 다시 확인해주세요.');
        }
    });
};
