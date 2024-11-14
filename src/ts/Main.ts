import { Context } from './Context.ts';

import { Scene } from './scenes/BaseScene';

import { BallPlaygroundScene } from './scenes/BallPlaygroundScene';
import { CannonScene } from './scenes/CannonScene';
import { FollowerScene } from './scenes/FollowerScene.ts';
import { MarblingScene } from './scenes/MarblingScene.ts'; 
import { StartfieldScene } from './scenes/Starfield';
import { BallShooterScene } from './scenes/BallShooterScene';
import { DesertScene } from './scenes/DesertScene';
import { SnakeScene } from './scenes/SnakeScene';
import { InfiniteScene } from './scenes/InfiniteScene';
import { WaveCollapseScene } from './scenes/WaveCollapseScene';
import { DragonCurveScene } from './scenes/DragonCurveScene';
import { SpaceshipScene } from './scenes/SpaceshipScene';
import { RayCastingScene } from './scenes/RayCastingScene';

const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
if (canvas == null) throw new Error("Canvas not found");

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas not found");

const context = new Context(canvas, ctx);
const scenes: Array<Scene> = [
    new MarblingScene(context),
    new BallPlaygroundScene(context),
    new FollowerScene(context),
    new StartfieldScene(context),
    new CannonScene(context),
    new BallShooterScene(context),
    new DesertScene(context),
    new SnakeScene(context),
    new InfiniteScene(context),
    new WaveCollapseScene(context),
    new DragonCurveScene(context),
    new SpaceshipScene(context),
    new RayCastingScene(context)
];
let sceneIndex = (scenes.length - 1 - 0) % scenes.length;

function animate(timestamp: number) {
    var scene = scenes[sceneIndex];

    context.canvas.width = window.innerWidth;
    context.canvas.height = window.innerHeight;

    if (context.update(timestamp)) {
        scene.tearDown();

        sceneIndex = (sceneIndex + 1) % scenes.length;
        scene = scenes[sceneIndex];

        scene.setup();
        
        context.resetForScene();
    }

    scene.update();
    context.updateInactivity(scene.autoPilotElapsed());
    
    context.beginRender();
    scene.render();
    context.endRender();

    requestAnimationFrame(animate);
}

animate(-1);

