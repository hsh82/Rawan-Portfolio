import { easyContentMiddleware } from '../server/middleware.mjs';

export function easyContentVitePlugin({ enabled = false } = {}) {
  return {
    name: 'rawan-easy-content',
    apply: 'serve',
    configureServer(server) {
      if (!enabled) return;
      // Serve the editor shell before Astro handles the request. The
      // middleware itself only accepts /dev/content/* and the editor script,
      // then delegates every other path to Vite.
      server.middlewares.use(easyContentMiddleware({ editorOnly: true }));
      server.middlewares.use('/__easy-content/api', easyContentMiddleware());
      server.middlewares.use('/__easy-content', easyContentMiddleware());
    },
  };
}

export function easyContentAstroIntegration({ enabled = false } = {}) {
  return {
    name: 'rawan-easy-content-editor-route',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev' || !enabled) return;
        injectRoute({ pattern: '/dev/content/[...path]', entrypoint: new URL('../editor/route.mjs', import.meta.url), prerender: false });
      },
    },
  };
}
