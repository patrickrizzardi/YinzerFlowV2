import { YinzerFlow } from '@core/YinzerFlow.ts';

const app = new YinzerFlow({});

app.get('/', (ctx) => {
  return {
    message: 'Hello World',
  };
});

await app.listen();

console.log(app.getRouteRegistry());
