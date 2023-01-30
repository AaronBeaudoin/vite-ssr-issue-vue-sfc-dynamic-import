const express = require("express");
const resolveConfig = require("vite").resolveConfig;
const createViteServer = require("vite").createServer;

resolveConfig({}, "serve").then(async viteConfig => {
  const app = express();
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom"
  });
  
  app.use(vite.middlewares);
  app.use("*", async (request, response, next) => {
    console.log(`[${request.originalUrl}]`);

    try {
      const module = await vite.ssrLoadModule("/entrypoints/server.js");
      const appHtml = await module.render();

      const html = `
        <html>
        <head>
          <!-- Prevent favicon requests to keep console output as minimal as possible. -->
          <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgo=">
        </head>
        <body>
          <div id="app">${appHtml}</div>
          <script type="module" src="/entrypoints/client.js"></script>
        </body>
        </html>
      `;

      response.statusCode = 200;
      response.contentType("text/html");
      response.send(await vite.transformIndexHtml(request.originalUrl, html));
      
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });

  const host = viteConfig.server.host || "0.0.0.0";
  const port = viteConfig.server.port || 3000;
  app.listen(port, host);
});
