import type { ContextImpl } from '@core/execution/ContextImpl.ts';
import { YinzerFlow } from '@core/YinzerFlow.ts';
import type { RouteResolvedGenerics } from '@typedefs/internal/Generics.js';
import type { ResponseFunctionResolved } from '@typedefs/internal/RouteRegistryResolved.js';

const app = new YinzerFlow({});

app.onError<{
  response: {
    success: boolean;
    message: string;
  };
}>((ctx) => {
  ctx.response.setStatusCode(404);
  return {
    success: false,
    message: 'Not Found',
  };
});

app.beforeAll(
  [
    (ctx) => {
      console.log('beforeAll');
    },
  ],
  {},
);

// Fix to be an array of functions
app.afterAll([
  (ctx) => {
    ctx.response.setStatusCode(202);
    console.log('afterAll');
  },
]);

app.post(
  '/get/:id',
  () => {
    console.log('route handler');

    return {
      message: 'Hello World',
    };
  },
  {
    beforeHooks: [
      (ctx) => {
        ctx.response.setStatusCode(200);
        console.log('beforeRoute');
      },
    ],
    afterHooks: [
      () => {
        console.log('afterRoute');
      },
    ],
  },
);

const callback: ResponseFunctionResolved = ({ request, response }) => {
  const body = request.body as { name: string };
  response.setStatusCode(200);

  return {
    success: true,
    message: 'Post request received',
  };
};

app.post('/post', callback);

await app.listen();

console.log(app.status());
