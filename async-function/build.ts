import esbuild from "esbuild";

const env = process.argv[2] === "local" ? "local" : "prod";
const entrypoint = env === "local" ? "./src/local.ts" : "./src/main.ts";
console.log(`Building ${entrypoint} for ${env}`);

await esbuild.build({
  bundle: true,
  entryPoints: [entrypoint],
  outdir: "./dist",
  outExtension: {
    ".js": ".mjs",
  },
  minify: env === "prod",
  platform: "node",
  format: "esm",
  banner: {
    js: 'import { createRequire } from "module"; import url from "url"; const require = createRequire(import.meta.url); const __filename = url.fileURLToPath(import.meta.url); const __dirname = url.fileURLToPath(new URL(".", import.meta.url));',
  },
});
