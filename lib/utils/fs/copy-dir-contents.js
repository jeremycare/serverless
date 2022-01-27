'use strict';

const fse = require('fs-extra');
const fsp = require('fs').promises;

const isNotSymbolicLink = async (src) => {
  const lstatResult = await fsp.lstat(src);
  return !lstatResult.isSymbolicLink();
};

async function copyDirContents(srcDir, destDir, { noLinks = false } = {}) {
  const copySyncOptions = {
    dereference: true,
    filter: noLinks ? await isNotSymbolicLink : null,
  };
  await fse.copy(srcDir, destDir, copySyncOptions);
}

module.exports = copyDirContents;
