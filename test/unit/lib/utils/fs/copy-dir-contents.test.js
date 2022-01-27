'use strict';

const expect = require('chai').expect;
const fsp = require('fs').promises;
const fse = require('fs-extra');
const path = require('path');
const copyDirContents = require('../../../../../lib/utils/fs/copy-dir-contents');
const fileExists = require('../../../../../lib/utils/fs/file-exists');
const writeFile = require('../../../../../lib/utils/fs/write-file');
const skipOnDisabledSymlinksInWindows = require('@serverless/test/skip-on-disabled-symlinks-in-windows');

describe('test/unit/lib/utils/fs/copy-dir-contents.test.js', () => {
  const afterCallback = () => {
    fse.removeSync(path.join(process.cwd(), 'testSrc'));
    fse.removeSync(path.join(process.cwd(), 'testDest'));
  };
  afterEach(afterCallback);

  it('should recursively copy directory files including symbolic links', async () => {
    const tmpSrcDirPath = path.join(process.cwd(), 'testSrc');
    const tmpDestDirPath = path.join(process.cwd(), 'testDest');

    const srcFile1 = path.join(tmpSrcDirPath, 'file1.txt');
    const srcFile2 = path.join(tmpSrcDirPath, 'folder', 'file2.txt');
    const srcFile3 = path.join(tmpSrcDirPath, 'folder', 'file3.txt');

    const destFile1 = path.join(tmpDestDirPath, 'file1.txt');
    const destFile2 = path.join(tmpDestDirPath, 'folder', 'file2.txt');
    const destFile3 = path.join(tmpDestDirPath, 'folder', 'file3.txt');

    await writeFile(srcFile1, 'foo');
    await writeFile(srcFile2, 'bar');
    try {
      await fsp.symlink(srcFile2, srcFile3);
    } catch (error) {
      skipOnDisabledSymlinksInWindows(error, this, afterCallback);
      throw error;
    }

    await copyDirContents(tmpSrcDirPath, tmpDestDirPath);

    expect(await fileExists(destFile1)).to.equal(true);
    expect(await fileExists(destFile2)).to.equal(true);
    expect(await fileExists(destFile3)).to.equal(true);
  });

  it('should recursively copy directory files excluding symbolic links', async () => {
    const tmpSrcDirPath = path.join(process.cwd(), 'testSrc');
    const tmpDestDirPath = path.join(process.cwd(), 'testDest');

    const srcFile1 = path.join(tmpSrcDirPath, 'file1.txt');
    const srcFile2 = path.join(tmpSrcDirPath, 'folder', 'file2.txt');
    const srcFile3 = path.join(tmpSrcDirPath, 'folder', 'file3.txt');

    const destFile1 = path.join(tmpDestDirPath, 'file1.txt');
    const destFile2 = path.join(tmpDestDirPath, 'folder', 'file2.txt');
    const destFile3 = path.join(tmpDestDirPath, 'folder', 'file3.txt');

    await writeFile(srcFile1, 'foo');
    await writeFile(srcFile2, 'bar');
    try {
      await fsp.symlink(srcFile2, srcFile3);
    } catch (error) {
      skipOnDisabledSymlinksInWindows(error, this, afterCallback);
      throw error;
    }

    await copyDirContents(tmpSrcDirPath, tmpDestDirPath, {
      noLinks: true,
    });

    expect(await fileExists(destFile1)).to.equal(true);
    expect(await fileExists(destFile2)).to.equal(true);
    expect(await fileExists(destFile3)).to.equal(false);
  });
});
