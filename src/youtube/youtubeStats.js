const axios = require('axios');

const YOUTUBE_CHANNEL_ID = 'UCm-43e3QtutTBrlD-MuUM1A';
const YOUTUBE_API_KEYS = [process.env.YOUTUBE_API_KEY_1];
let currentApiKeyIndex = 0;

async function getYoutubeStats() {
    let apiKey = YOUTUBE_API_KEYS[currentApiKeyIndex];

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'statistics',
                id: YOUTUBE_CHANNEL_ID,
                key: apiKey
            }
        });

        const stats = response.data.items[0].statistics;
        return {
            subscriberCount: stats.subscriberCount || '0',
            videoCount: stats.videoCount || '0',
            viewCount: stats.viewCount || '0'
        };
    } catch (error) {
        console.error(`YouTube API 오류 (API 키 ${currentApiKeyIndex}):`, error);

        currentApiKeyIndex = (currentApiKeyIndex + 1) % YOUTUBE_API_KEYS.length;
        console.log(`다음 API 키로 전환: ${currentApiKeyIndex}`);

        return getYoutubeStats();
    }
}

// ✅ 이렇게 내보내기
module.exports = { getYoutubeStats };
