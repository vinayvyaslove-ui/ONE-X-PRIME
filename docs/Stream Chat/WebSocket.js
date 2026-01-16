const ws = new WebSocket('wss://api.gst-ai.com/v1/ai/chat/stream');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.chunk); // Streamed response chunks
};