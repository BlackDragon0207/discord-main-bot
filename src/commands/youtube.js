require('dotenv/config');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('검색')
        .setDescription('YouTube에서 영상을 검색합니다.')
        .addStringOption(option =>
            option.setName('검색어')
                .setDescription('검색할 키워드를 입력하세요.')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('검색어');
        const apiKey = process.env.YOUTUBE_API_KEY;
        const maxResults = 5;

        try {
            const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                params: {
                    part: 'snippet',
                    q: query,
                    maxResults: maxResults,
                    type: 'video',
                    key: apiKey,
                },
            });

            const videos = response.data.items;

            if (videos.length === 0) {
                await interaction.reply('검색 결과가 없습니다.');
                return;
            }

            // 첫 번째 검색 결과의 채널 ID를 가져와 채널 정보를 요청
            const channelId = videos[0].snippet.channelId;
            const channelResponse = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
                params: {
                    part: 'snippet',
                    id: channelId,
                    key: apiKey,
                },
            });

            // 채널 프로필 이미지 URL
            const channelProfileImage = channelResponse.data.items[0].snippet.thumbnails.default.url;

            // Embed 메시지 생성
            const embed = new EmbedBuilder()
                .setTitle(`YouTube 검색어 : ${query}`)
                .setColor('#FF0000')
                .setThumbnail(channelProfileImage)
                .setFooter({
                    text: '검색된 영상 리스트',
                    iconURL: interaction.client.user.displayAvatarURL(), // 봇의 아이콘을 추가
                });

            // 검색된 비디오 추가
            videos.forEach((video, index) => {
                const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
                const videoTitle = video.snippet.title;
                const channelTitle = video.snippet.channelTitle;

                embed.addFields({
                    name: `${index + 1}. ${channelTitle} - ${videoTitle}`,
                    value: `[영상 보기](${videoUrl})`,
                });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('YouTube API 요청 중 오류 발생:', error);
            await interaction.reply('YouTube 검색 중 오류가 발생했습니다.');
        }
    },
};
