import * as esbuild from "esbuild";

esbuild
  .serve(
    {
      servedir: "./example",
      onRequest: (args) => console.log(args),
    },
    {
      bundle: true,
      entryPoints: ["example/main.ts"],
      outfile: "example/out.js",
      sourcemap: "inline",
    }
  )
  .then(console.log)
  .catch(console.error);
