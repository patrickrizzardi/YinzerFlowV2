import { YinzerFlow } from '@core/YinzerFlow.ts';
import type { HandlerCallback } from '@typedefs/public/Context.js';

const app = new YinzerFlow({
  logLevel: 'verbose',
  cors: {
    enabled: true,
    origin: '*',
    exposedHeaders: ['*'],
    allowedHeaders: ['*'],
    methods: ['*'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
});

app.onError((ctx) => {
  ctx.response.setStatusCode(404);
  return {
    success: false,
    message: 'Something went wrong',
  };
});

app.onNotFound((ctx) => {
  ctx.response.setStatusCode(404);
  return {
    success: false,
    message: 'Not Found',
  };
});

app.beforeAll([
  (ctx) => {
    console.log('======== beforeAll ========');
  },
]);

app.afterAll([
  (ctx) => {
    ctx.response.setStatusCode(202);
    console.log('afterAll');
  },
]);
app.group('/api', (app) => {
  app.post(
    '/get/:id',
    ((ctx) => {
      console.log('route handler');
      console.log(ctx.request);

      return {
        message: 'Hello World',
      };
    }) satisfies HandlerCallback<{
      body: {
        name: string;
      };
      response: {
        message: string;
      };
    }>,
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
});

const callback: HandlerCallback<{
  response: {
    success: false;
    message: string;
  };
  body: {
    name: string;
  };
  query: {
    name: string;
  };
  params: {
    id: string;
  };
}> = ({ request, response }) => {
  response.setStatusCode(200);

  console.log(request.query.name);

  return {
    success: false,
    message: 'Post request received',
  };
};

app.post('/login', callback);

await app.listen();
