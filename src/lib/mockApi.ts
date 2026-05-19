export async function simulateFetchStreaming(prompt: string): Promise<Response> {
  const words = `Here is a simulated streaming response for your prompt: "${prompt}". It contains multiple tokens that are streamed one by one. This allows you to see the text appearing in real-time. In a real-world scenario, this would be coming from an actual language model backend. Let's add some more text to make it longer and more interesting to watch as it streams onto the screen. We can also simulate a mid-stream failure if the prompt contains the word "fail".`.split(' ');
  
  const shouldFail = prompt.toLowerCase().includes('fail');
  const failIndex = shouldFail ? Math.floor(words.length / 2) : -1;

  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i++) {
        if (i === failIndex) {
          controller.error(new Error("Simulated mid-stream network drop"));
          return;
        }
        controller.enqueue(new TextEncoder().encode(words[i] + (i < words.length - 1 ? ' ' : '')));
        await new Promise(r => setTimeout(r, 40)); // 40ms per token
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
