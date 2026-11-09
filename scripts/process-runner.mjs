import { spawn, spawnSync } from 'node:child_process';

/** Run a Node entry point without an npm shell or intermediate process. */
export function runNode(args, env = process.env) {
  const child = spawn(process.execPath, args, { env, stdio: 'inherit', windowsHide: true });
  let stopping = false;
  const stop = signal => {
    if (stopping) return;
    stopping = true;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    } else child.kill(signal);
  };
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop);
  child.once('error', error => { console.error(`Cannot start ${args[0]}: ${error.message}`); process.exitCode = 1; });
  child.once('exit', (code, signal) => {
    for (const name of ['SIGINT', 'SIGTERM']) process.removeListener(name, stop);
    process.exitCode = code ?? (signal === 'SIGINT' ? 130 : signal ? 143 : 1);
  });
  return child;
}
