import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import fancyLog from 'fancy-log';
import acolors from 'ansi-colors';

const _root = path.resolve(__dirname, '..');


/**
 * Plaform independant path to an executable cmd
 * @param {string} path
 */
export const platformPath = (path) => {
  return /^win/.test(os.platform()) ? `${path}.cmd` : path;
};

/**
 *
 * @param {string[]} args
 */
export const rootDir = (...args) => {
  return path.join.apply(path, [_root].concat(...args));
};

/**
 *
 * @param {string} cmd
 */
export const binPath = (cmd) => {
  return platformPath(`/node_modules/.bin/${cmd}`);
};

/**
 * Promisified child_process.exec
 *
 * @param cmd
 * @param opts See child_process.exec node docs
 * @returns {Promise<number>}
 */
export const execp = (cmd, opts) => {
  opts = Object.assign(opts || {}, {
    stdout: process.stdout,
    stderr: process.stderr
  });
  return new Promise((resolve, reject) => {
    const child = exec(cmd, opts,
      (err, stdout, stderr) => err ? reject(err.code) : resolve(0));

    if (opts.stdout) {
      child.stdout.pipe(opts.stdout);
    }
    if (opts.stderr) {
      child.stderr.pipe(opts.stderr);
    }
  });
};

export const execCmd = (name, args, opts, ...subFolders) => {
  const cmd = rootDir(subFolders, binPath(`${name}`));
  return execp(`${cmd} ${args}`, opts)
    .catch(e => {
      fancyLog(acolors.red(`${name} command failed. See below for errors.\n`));
      fancyLog(acolors.red(e));
      process.exit(1);
    });
};

export const execExternalCmd = (name, args, opts) => {
  return execp(`${name} ${args}`, opts)
    .catch(e => {
      fancyLog(acolors.red(`${name} command failed. See below for errors.\n`));
      fancyLog(acolors.red(e));
      process.exit(1);
    });
};
