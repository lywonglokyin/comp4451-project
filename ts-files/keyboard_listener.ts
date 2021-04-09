export class KeyboardListener {
    value: string;
    private _isDown: boolean = false;
    pressed: ()=>void = ()=>{};
    released: ()=>void = ()=>{};

    constructor(key: string) {
        this.value = key;
        window.addEventListener('keydown', this.downListener, false);
        window.addEventListener('keyup', this.upListener, false);
    }

    public get isDown(): boolean {
        return this._isDown;
    }

    public get isUp(): boolean {
        return !this._isDown;
    }

    public unsubscribe(): void {
        window.removeEventListener('keydown', this.downListener);
        window.removeEventListener('keyup', this.upListener);
    }

    private downListener:(e: KeyboardEvent)=>void = (event: KeyboardEvent) => {
        if (event.code === this.value) {
            if (this.isUp) {
                this.pressed();
                this._isDown = true;
            }
            event.preventDefault();
        }
    }

    private upListener: (e: KeyboardEvent)=>void = (event: KeyboardEvent) => {
        if (event.code === this.value) {
            if (this.isDown) {
                this.released();
                this._isDown = false;
            }
            event.preventDefault();
        }
    }
}
