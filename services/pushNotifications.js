const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendChatPush = async ({ tokens, title, body, data }) => {
  const messages = tokens
    .filter((token) => typeof token === 'string' && token.startsWith('ExponentPushToken['))
    .map((to) => ({ to, title, body, data, sound: 'default', priority: 'high' }));

  if (!messages.length) return;

  for (let index = 0; index < messages.length; index += 100) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(index, index + 100))
    });

    if (!response.ok) throw new Error(`Expo push API error: ${response.status}`);
  }
};

module.exports = { sendChatPush };