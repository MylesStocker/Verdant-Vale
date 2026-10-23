#!/usr/bin/env node
'use strict';
// No browser dependency or bundled binaries. Set VV_BROWSER to a Chromium
// executable when it is not installed at one of the ordinary locations.
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..');
async function main(){
  const browser=[process.env.VV_BROWSER,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].find(p=>p&&fs.existsSync(p));
  if(!browser)throw Error('Chromium unavailable; set VV_BROWSER. Browser checks were NOT run.');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'verdant-browser-'));
  const server=http.createServer((req,res)=>{
    const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+relative);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end();return;}
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.png')?'image/png':'application/octet-stream');res.end(data);});
  });
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const page=process.env.VV_BROWSER_PAGE||'browser-smoke.html';
    if(!/^[a-z0-9-]+\.html$/.test(page))throw Error('Invalid local browser test page');
    const address='http://127.0.0.1:'+server.address().port+'/test/'+page;
    const output=await new Promise((resolve,reject)=>{
      const child=spawn(browser,['--headless','--disable-gpu','--no-first-run','--user-data-dir='+temporary,'--dump-dom','--virtual-time-budget=30000',address]);
      let stdout='',stderr='';child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
      const timeout=setTimeout(()=>{child.kill();reject(Error('Browser smoke timed out'));},60000);
      child.on('error',reject);child.on('close',code=>{clearTimeout(timeout);code?reject(Error(stderr)):resolve(stdout);});
    });
    const match=output.match(/<pre id="results">([\s\S]*?)<\/pre>/);
    if(!match||match[1]==='RUNNING')throw Error('Browser did not finish the smoke suite');
    const result=JSON.parse(match[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'));
    const outputDir=process.env.VV_BROWSER_OUTPUT;
    if(outputDir){fs.mkdirSync(outputDir,{recursive:true});for(const capture of result.captures)fs.writeFileSync(path.join(outputDir,capture.name+'.png'),Buffer.from(capture.png.split(',')[1],'base64'));}
    console.log(JSON.stringify({...result,captures:result.captures.map(c=>c.name)},null,2));
    if(!result.ok)throw Error('Browser smoke failed');
  }finally{server.close();fs.rmSync(temporary,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
