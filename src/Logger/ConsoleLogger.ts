import { Logger } from "./types/Logger";

export class ConsoleLogger implements Logger {
  static #instance: ConsoleLogger = new ConsoleLogger();

  private constructor() {}

  public dumpError(error: Error): void {
    console.dir(error, { depth: null });
  }

  public static getGlobalLogger(): Logger {
    return this.#instance;
  }
}
