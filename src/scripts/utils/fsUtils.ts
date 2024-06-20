import { NS } from '@ns';
import { promisify } from 'scripts/utils/promiseUtils';

export class FileSystem<T = unknown> {
  constructor(private readonly ns: NS, private readonly filepath: string) {}

  /**
   * Creates a new file or clears an existing one.
   */
  public async newFile() {
    await this.write('' as any as T, 'w');
  }

  public async write(data: T, mode: 'w' | 'a' = 'w') {
    return await promisify(
      this.ns.write,
      this.filepath,
      JSON.stringify(data),
      mode
    );
  }

  /**
   * Reads data from the file and parses it from JSON.
   */
  public async read(): Promise<T | null> {
    const str = await promisify(this.ns.read, this.filepath);
    return str.length > 0 ? JSON.parse(str) : null;
  }
}
