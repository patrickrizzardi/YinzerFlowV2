import { describe, expect, it } from 'bun:test';
import { YinzerFlow } from '@core/YinzerFlow.ts';

describe('YinzerFlow', () => {
  it('should listen to the server', async () => {
    const app = new YinzerFlow({}); // Use different port
    await app.listen();
    expect(app.status().isListening).toBe(true);
    await app.close(); // Clean up
  });

  it('should close the server', async () => {
    const app = new YinzerFlow({}); // Use different port
    await app.listen();
    await app.close();
    expect(app.status().isListening).toBe(false);
  });
});
