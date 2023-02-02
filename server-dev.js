const fs = require("fs");
const http = require("http");
const connect = require("connect");
const vite = require("vite");

vite.resolveConfig({}, "serve").then(async config => {
  const app = connect();

  const server = await vite.createServer({
    server: { middlewareMode: true },
    appType: "custom"
  });
  
  app.use(server.middlewares);
  app.use(async (request, response, next) => {
    try {
      const module = await server.ssrLoadModule("/entrypoint-server.js");
      let html = fs.readFileSync("./index.html", "utf-8");
      html = html.replace("<!--app-->", await module.render());
      html = await server.transformIndexHtml(request.originalUrl, html);
      
      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html");
      response.end(html);
      
    } catch (error) {
      server.ssrFixStacktrace(error);
      next(error);
    }
  });

  http.createServer(app).listen(
    config.server.port || 3000,
    config.server.host || "0.0.0.0");
});
