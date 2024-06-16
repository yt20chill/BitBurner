import { NS, Server } from '@ns';

export type ServerNodeDto = {
  name: string;
  parent: string | null;
  depth: number;
  path: string;
  info: Server;
};
export class ServerNode {
  private _path?: string;
  private _depth?: number;
  private _children?: ServerNode[];

  get path(): string {
    if (!this._path) {
      this._path = this.getPath();
    }
    return this._path;
  }

  get depth(): number {
    if (this._depth === undefined) {
      this._depth = this.path.split('=>').length - 1;
    }
    return this._depth;
  }

  get name(): string {
    return this._name;
  }

  get parent(): ServerNode | null {
    return Object.assign({}, this._parent);
  }

  get children(): ServerNode[] {
    if (!this._children) {
      this._children = this.ns
        .scan(this._name)
        .map(
          (child) => new ServerNode(this.ns, child, Object.assign({}, this))
        );
    }
    return this._children;
  }

  get info() {
    return this.ns.getServer(this._name);
  }

  constructor(
    private readonly ns: NS,
    private readonly _name: string,
    private readonly _parent: ServerNode | null
  ) {}

  toJSON() {
    return JSON.stringify({
      name: this._name,
      parent: this._parent?._name ?? null,
      depth: this.depth,
      path: this.path,
      info: this.info,
    });
  }

  private getPath() {
    let path = this._name;
    let current: ServerNode = this;

    while (current._parent) {
      path = `${current._parent._name} => ${path}`;
      current = current._parent;
    }

    return path;
  }
}
