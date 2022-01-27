'use strict';

const path = require('path');
const fsp = require('fs').promises;

// TODO: TESTS
async function walkDir(dirPath, opts) {
  const options = Object.assign(
    {
      noLinks: false,
    },
    opts
  );
  let filePaths = [];
  const list = await fsp.readdir(dirPath);

  for (const filePathParam of list) {
    let filePath = filePathParam;
    filePath = path.join(dirPath, filePath);
    const stat = options.noLinks ? await fsp.lstat(filePath) : await fsp.stat(filePath);
    // skipping symbolic links when noLinks option
    if (options.noLinks && stat && stat.isSymbolicLink()) {
      continue;
    } else if (stat && stat.isDirectory()) {
      filePaths = filePaths.concat(await walkDir(filePath, opts));
    } else {
      filePaths.push(filePath);
    }
  }

  return filePaths;
}

module.exports = walkDir;
