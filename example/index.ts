import { YinzerFlow } from '@core/YinzerFlow.ts';

const app = new YinzerFlow({});

app.post('/user/:id', (ctx) => {
  console.log(ctx.request.body);
  return {
    message: 'Hello World',
  };
});

await app.listen();

console.log(app.status());
