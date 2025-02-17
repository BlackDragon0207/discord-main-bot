const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const PAGE_SIZE = 25; // 페이지당 최대 25개 옵션
const MAX_PAGES = 10; // 페이지 최대 개수 (Select Menu의 옵션 제한을 고려하여)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('차단목록')
        .setDescription('서버에서 차단된 유저들의 목록을 Select Menu로 표시합니다'),
    async execute(interaction) {
        try {
            const bans = await interaction.guild.bans.fetch();

            if (bans.size === 0) {
                await interaction.reply('차단된 유저가 없습니다.');
                return;
            }

            const banArray = Array.from(bans.values());
            let currentPage = 0;

            // 기본 메시지
            const initialEmbed = new EmbedBuilder()
                .setDescription('차단된 유저 목록에서 선택해주세요.')
                .setColor('#FF0000');

            // Select Menu와 페이지 네비게이션 버튼 생성
            const selectMenuRow = createSelectMenu(banArray, currentPage);
            const navRow = createNavigationButtons(currentPage, banArray.length);

            const message = await interaction.reply({ embeds: [initialEmbed], components: [selectMenuRow, navRow], fetchReply: true });

            // Select Menu 상호작용 처리
            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 60000, // 60초 후 자동 종료
            });

            collector.on('collect', async i => {
                const selectedUserId = i.values[0];
                const selectedBan = banArray.find(ban => ban.user.id === selectedUserId);

                if (selectedBan) {
                    const selectedEmbed = createBanEmbed(selectedBan);
                    await i.update({ embeds: [selectedEmbed], components: [selectMenuRow, navRow] });
                }
            });

            // 버튼 상호작용 처리
            const buttonCollector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000, // 60초 후 자동 종료
            });

            buttonCollector.on('collect', async i => {
                if (i.customId === 'previous') {
                    if (currentPage > 0) {
                        currentPage--;
                    }
                } else if (i.customId === 'next') {
                    if (currentPage < Math.ceil(banArray.length / PAGE_SIZE) - 1) {
                        currentPage++;
                    }
                }

                // 새 페이지의 Select Menu와 버튼 생성
                const newSelectMenuRow = createSelectMenu(banArray, currentPage);
                const newNavRow = createNavigationButtons(currentPage, banArray.length);

                // 새로운 페이지에 대한 메시지 업데이트
                await i.update({
                    components: [newSelectMenuRow, newNavRow]
                });
            });

            buttonCollector.on('end', () => {
                message.edit({ components: [] }); // 시간이 끝나면 버튼 제거
            });

        } catch (error) {
            console.error('차단된 유저 목록을 가져오는 중 오류 발생:', error); // 오류 내용 자세히 확인
            await interaction.reply(`차단된 유저 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`);
        }
    },
};

// 유저의 차단 정보를 포함한 임베드 생성 함수
function createBanEmbed(ban) {
    return new EmbedBuilder()
        .setTitle(`차단된 유저`)
        .setDescription(`**사용자**: <@${ban.user.id}>\n**ID**: ${ban.user.id}\n**사유**: ${ban.reason || '사유 없음'}`)
        .setThumbnail(ban.user.displayAvatarURL({ dynamic: true, size: 1024 }))  // 유저 프로필 사진
        .setColor('#FF0000')  // 빨간색으로 설정
        .setTimestamp();
}

// Select Menu로 차단된 유저 리스트 생성
function createSelectMenu(banArray, page) {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const options = banArray.slice(start, end).map(ban => ({
        label: ban.user.tag, // 유저의 태그 표시
        description: `ID: ${ban.user.id}`,
        value: ban.user.id, // 유저 ID를 값으로 사용
    }));

    return new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('selectBanUser')
                .setPlaceholder('차단된 유저를 선택하세요')
                .addOptions(options)
        );
}

// 페이지 네비게이션 버튼 생성
function createNavigationButtons(currentPage, totalItems) {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('이전')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('다음')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === totalPages - 1)
        );
}
