import webpack from "webpack";
import path from "path";
import { fileURLToPath } from "url";
import AmbientDtsPlugin from "./plugins/AmbientDtsPlugin";
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const devMode = process.env.NODE_ENV !== "production";

const baseConfig: webpack.Configuration = {
  devtool: "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  resolveLoader: {
    modules: ["node_modules", path.resolve(__dirname, "loaders")],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: "/node_modules/",
        options: {
          configFile: "tsconfig.build.json",
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      BASEPATH: JSON.stringify(""),
    }),
  ],
  experiments: {
    outputModule: true,
  },
};

function createOutputConfig(
  outputFile: string,
  entry: string,
  type: "module" | "commonjs",
) {
  return {
    ...baseConfig,
    entry: entry,
    output: {
      filename: outputFile,
      path: path.resolve(__dirname, "dist"),
      library: {
        type: type,
      },
    },
  };
}

const indexEsmConfig: webpack.Configuration = {
  ...createOutputConfig("index.js", "./src/index.ts", "module"),
  plugins: [
    ...(baseConfig.plugins || []),
    new AmbientDtsPlugin({
      outputPath: path.resolve(__dirname, "dist", "ambient.d.ts"),
      dtsDir: path.resolve(__dirname, "dist"),
    }),
    new NodePolyfillPlugin(),
  ],
};

const indexCjsConfig: webpack.Configuration = createOutputConfig(
  "index.cjs",
  "./src/index.ts",
  "commonjs",
);

const storageEsmConfig: webpack.Configuration = createOutputConfig(
  "storage.js",
  "./src/storage.ts",
  "module",
);

const storageCjsConfig: webpack.Configuration = createOutputConfig(
  "storage.cjs",
  "./src/storage.ts",
  "commonjs",
);

export default [
  indexEsmConfig,
  indexCjsConfig,
  storageEsmConfig,
  storageCjsConfig,
];
