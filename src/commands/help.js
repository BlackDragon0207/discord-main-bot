const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('문의')
        .setDescription('문의 채널을 생성합니다.'),
    async execute(interaction) {
        const categoryId = '1345331555190444033'; // 문의 채널이 생성될 카테고리 ID
        const adminRoleId = '1331961316524429443'; // 관리자 역할 ID
        const user = interaction.user;
        const guild = interaction.guild;

        // 기존 문의 채널이 있는지 확인
        const existingChannel = guild.channels.cache.find(channel => 
            channel.name === `문의-${user.username}` && channel.parentId === categoryId
        );

        if (existingChannel) {
            return interaction.reply({
                content: '이미 문의 채널이 존재합니다!',
                ephemeral: true
            });
        }

        // 문의 채널 생성
        const channel = await guild.channels.create({
            name: `문의-${user.username}`,
            type: 0,
            parent: categoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: adminRoleId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                }
            ]
        });

        // 임베드 메시지 생성
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📩 문의 접수')
            .setDescription(`${user}, 문의 내용을 입력해주세요. 관리자가 확인 후 답변을 드리겠습니다.`)
            .setTimestamp();

        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `문의 채널이 생성되었습니다! ${channel}`, ephemeral: true });
    }
};
