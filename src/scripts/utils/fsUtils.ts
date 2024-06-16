import { NS } from '@ns';
import { promisify } from 'scripts/utils/promiseUtils';

export class FileSystem<T = unknown> {
  constructor(private readonly ns: NS, private readonly filepath: string) {}

  /**
   * Creates a new file or clears an existing one.
   */
  async newFile() {
    await this.write('' as T, 'w');
  }

  async write(data: T, mode: 'w' | 'a' = 'w') {
    const formattedData = JSON.stringify(data);
    return await promisify(this.ns.write, this.filepath, formattedData, mode);
  }

  /**
   * Reads data from the file and parses it from JSON.
   */
  async read(): Promise<T | null> {
    let dataString = await promisify(this.ns.read, this.filepath);
    return dataString.length > 0 ? JSON.parse(dataString) : null;
  }
}
