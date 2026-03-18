import { Logger } from "./types/Logger";
import * as util from "util";

export class ConsoleLogger implements Logger {
  static #instance: ConsoleLogger = new ConsoleLogger();

  private constructor() {}

  public dumpError(error: Error): void {
    console.error(
      util.inspect(error, { showHidden: false, depth: null, colors: true }),
    );
  }

  public static getGlobalLogger(): Logger {
    return this.#instance;
  }
}
