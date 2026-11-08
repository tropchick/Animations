import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition,openBrowser} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [folder='out/three-review/stills',...args]=process.argv.slice(2);
const secs=args.length?args.map(Number):[0,.3,.83,3.3,4.8,6,10,12.7,13.6,16,18.5,20.8,24,28,29.2,30.4,31.6,32.1,33.6,36.8,38,40.6,44.1,46.5,48.8,51.4,54,56];
fs.mkdirSync(folder,{recursive:true});
const chromiumOptions={gl:'swangle'};
const browser=await openBrowser('chrome',{chromiumOptions,browserExecutable:'/usr/bin/google-chrome'});
try{const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});const composition=await selectComposition({serveUrl,id:'ThreeStories',browserInstance:browser,chromiumOptions});for(const sec of secs){const frame=Math.round(sec*30);await renderStill({serveUrl,composition,frame,output:path.join(folder,`f${String(frame).padStart(4,'0')}.jpg`),imageFormat:'jpeg',jpegQuality:90,scale:.5,browserInstance:browser,chromiumOptions});console.log('Rendered',sec)}}finally{await browser.close({silent:true})}
