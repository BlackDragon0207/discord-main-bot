const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('관리자')
        .setDescription('관리자 전용 명령어입니다.'),
    async execute(interaction) {
        // 관리자 유저 ID 목록
        const allowedUserIds = ['435800525389430804', '616570697875193866']; 

        // 호출자의 ID가 관리자 목록에 포함되어 있는지 확인
        if (!allowedUserIds.includes(interaction.user.id)) {
            return interaction.reply({
                content: '이 명령어는 관리자만 사용할 수 있습니다.',
                ephemeral: true // 호출자에게만 보이는 메시지
            });
        }

        // 관리자에게만 보이는 응답
        await interaction.reply({
            content: `공식 봇 관리자임을 확인되었습니다. \nUser ID: ${interaction.user.id}`,
            ephemeral: false // 호출자에게만 보이는 메시지
        });

        // 여기에 관리자만 사용할 수 있는 기능을 추가할 수 있습니다.
    },
};
