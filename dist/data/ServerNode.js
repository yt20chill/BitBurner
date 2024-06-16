export class ServerNode {
    ns;
    _name;
    _parent;
    _path;
    _depth;
    _children;
    get path() {
        if (!this._path) {
            this._path = this.getPath();
        }
        return this._path;
    }
    get depth() {
        if (this._depth === undefined) {
            this._depth = this.path.split('=>').length - 1;
        }
        return this._depth;
    }
    get name() {
        return this._name;
    }
    get parent() {
        return Object.assign({}, this._parent);
    }
    get children() {
        if (!this._children) {
            this._children = this.ns
                .scan(this._name)
                .map((child) => new ServerNode(this.ns, child, Object.assign({}, this)));
        }
        return this._children;
    }
    get info() {
        return this.ns.getServer(this._name);
    }
    constructor(ns, _name, _parent) {
        this.ns = ns;
        this._name = _name;
        this._parent = _parent;
    }
    toJSON() {
        return JSON.stringify({
            name: this._name,
            parent: this._parent?._name ?? null,
            depth: this.depth,
            path: this.path,
            info: this.info,
        });
    }
    getPath() {
        let path = this._name;
        let current = this;
        while (current._parent) {
            path = `${current._parent._name} => ${path}`;
            current = current._parent;
        }
        return path;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmVyTm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9kYXRhL1NlcnZlck5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsTUFBTSxPQUFPLFVBQVU7SUEyQ0Y7SUFDQTtJQUNBO0lBNUNYLEtBQUssQ0FBVTtJQUNmLE1BQU0sQ0FBVTtJQUNoQixTQUFTLENBQWdCO0lBRWpDLElBQUksSUFBSTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDN0I7UUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQUksS0FBSztRQUNQLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1NBQ2hEO1FBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQUksTUFBTTtRQUNSLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFO2lCQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDaEIsR0FBRyxDQUNGLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUNuRSxDQUFDO1NBQ0w7UUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxZQUNtQixFQUFNLEVBQ04sS0FBYSxFQUNiLE9BQTBCO1FBRjFCLE9BQUUsR0FBRixFQUFFLENBQUk7UUFDTixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ2IsWUFBTyxHQUFQLE9BQU8sQ0FBbUI7SUFDMUMsQ0FBQztJQUVKLE1BQU07UUFDSixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDcEIsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxJQUFJO1lBQ25DLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLE9BQU87UUFDYixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3RCLElBQUksT0FBTyxHQUFlLElBQUksQ0FBQztRQUUvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDdEIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDN0MsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7U0FDM0I7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5TLCBTZXJ2ZXIgfSBmcm9tICdAbnMnO1xuXG5leHBvcnQgdHlwZSBTZXJ2ZXJOb2RlRHRvID0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIHBhcmVudDogc3RyaW5nIHwgbnVsbDtcbiAgZGVwdGg6IG51bWJlcjtcbiAgcGF0aDogc3RyaW5nO1xuICBpbmZvOiBTZXJ2ZXI7XG59O1xuZXhwb3J0IGNsYXNzIFNlcnZlck5vZGUge1xuICBwcml2YXRlIF9wYXRoPzogc3RyaW5nO1xuICBwcml2YXRlIF9kZXB0aD86IG51bWJlcjtcbiAgcHJpdmF0ZSBfY2hpbGRyZW4/OiBTZXJ2ZXJOb2RlW107XG5cbiAgZ2V0IHBhdGgoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuX3BhdGgpIHtcbiAgICAgIHRoaXMuX3BhdGggPSB0aGlzLmdldFBhdGgoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gIH1cblxuICBnZXQgZGVwdGgoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fZGVwdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fZGVwdGggPSB0aGlzLnBhdGguc3BsaXQoJz0+JykubGVuZ3RoIC0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2RlcHRoO1xuICB9XG5cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbmFtZTtcbiAgfVxuXG4gIGdldCBwYXJlbnQoKTogU2VydmVyTm9kZSB8IG51bGwge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzLl9wYXJlbnQpO1xuICB9XG5cbiAgZ2V0IGNoaWxkcmVuKCk6IFNlcnZlck5vZGVbXSB7XG4gICAgaWYgKCF0aGlzLl9jaGlsZHJlbikge1xuICAgICAgdGhpcy5fY2hpbGRyZW4gPSB0aGlzLm5zXG4gICAgICAgIC5zY2FuKHRoaXMuX25hbWUpXG4gICAgICAgIC5tYXAoXG4gICAgICAgICAgKGNoaWxkKSA9PiBuZXcgU2VydmVyTm9kZSh0aGlzLm5zLCBjaGlsZCwgT2JqZWN0LmFzc2lnbih7fSwgdGhpcykpXG4gICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jaGlsZHJlbjtcbiAgfVxuXG4gIGdldCBpbmZvKCkge1xuICAgIHJldHVybiB0aGlzLm5zLmdldFNlcnZlcih0aGlzLl9uYW1lKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgbnM6IE5TLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgX25hbWU6IHN0cmluZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IF9wYXJlbnQ6IFNlcnZlck5vZGUgfCBudWxsXG4gICkge31cblxuICB0b0pTT04oKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIG5hbWU6IHRoaXMuX25hbWUsXG4gICAgICBwYXJlbnQ6IHRoaXMuX3BhcmVudD8uX25hbWUgPz8gbnVsbCxcbiAgICAgIGRlcHRoOiB0aGlzLmRlcHRoLFxuICAgICAgcGF0aDogdGhpcy5wYXRoLFxuICAgICAgaW5mbzogdGhpcy5pbmZvLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQYXRoKCkge1xuICAgIGxldCBwYXRoID0gdGhpcy5fbmFtZTtcbiAgICBsZXQgY3VycmVudDogU2VydmVyTm9kZSA9IHRoaXM7XG5cbiAgICB3aGlsZSAoY3VycmVudC5fcGFyZW50KSB7XG4gICAgICBwYXRoID0gYCR7Y3VycmVudC5fcGFyZW50Ll9uYW1lfSA9PiAke3BhdGh9YDtcbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50Ll9wYXJlbnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cbn1cbiJdfQ==