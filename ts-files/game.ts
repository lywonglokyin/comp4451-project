import * as pixi_namespace from 'pixi.js'
import { Application, Rectangle, Sprite } from 'pixi.js';
import { movableSprite } from './moveableSprite';

declare var PIXI:  typeof pixi_namespace;

const app: Application = new PIXI.Application({transparent: true});
document.body.appendChild(app.view);



let cats: movableSprite[] = [];
let total_cats: number = 50;

for (let i = 0; i < total_cats; i++){
    const cat: movableSprite = PIXI.Sprite.from('images/cat.png');
    cat.anchor.set(0.5);

    cat.x = Math.random() * app.screen.width;
    cat.y = Math.random() * app.screen.height;

    cat.tint = Math.random() * 0xFFFF;

    cat.direction = Math.random() * Math.PI * 2;
    cat.turningSpeed = Math.random() - 0.8;
    cat.speed = 2 + Math.random()*2;

    cats.push(cat);

    app.stage.addChild(cat);
}

let catBoundsPadding: number = 100;
let catBounds : Rectangle = new PIXI.Rectangle(-catBoundsPadding, -catBoundsPadding,
    app.screen.width + catBoundsPadding * 2, app.screen.height + catBoundsPadding * 2);

app.ticker.add(function(){
    for (let i = 0; i < cats.length; i++) {
        let cat = cats[i];
        cat.direction! += cat.turningSpeed! * 0.01;
        cat.x += Math.sin(cat.direction!) * cat.speed!;
        cat.y += Math.cos(cat.direction!) * cat.speed!;
        cat.rotation! = -cat.direction! - Math.PI / 2;

        if (cat.x < catBounds.x) {
            cat.x += catBounds.width;
        } else if (cat.x > catBounds.x + catBounds.width) {
            cat.x -= catBounds.width;
        }

        if (cat.y < catBounds.y) {
            cat.y += catBounds.height;
        } else if (cat.y > catBounds.y + catBounds.height) {
            cat.y -= catBounds.height;
        }
    }
})
