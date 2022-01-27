'use strict';

const fsp = require('fs').promises;
const path = require('path');
const writeFile = require('../../../../../lib/utils/fs/write-file');
const walkDir = require('../../../../../lib/utils/fs/walk-dir');
const { expect } = require('chai');
const { getTmpDirPath } = require('../../../../utils/fs');
const skipOnDisabledSymlinksInWindows = require('@serverless/test/skip-on-disabled-symlinks-in-windows');

describe('test/unit/lib/utils/fs/walk-dir.test.js', () => {
  it('should return an array with corresponding paths to the found files', async () => {
    const tmpDirPath = getTmpDirPath();

    const nestedDir1 = path.join(tmpDirPath, 'foo');
    const nestedDir2 = path.join(tmpDirPath, 'foo', 'bar');
    const nestedDir3 = path.join(tmpDirPath, 'baz');

    const tmpFilePath1 = path.join(nestedDir1, 'foo.js');
    const tmpFilePath2 = path.join(nestedDir2, 'bar.js');
    const tmpFilePath3 = path.join(nestedDir3, 'baz.js');

    await writeFile(tmpFilePath1, 'foo');
    await writeFile(tmpFilePath2, 'bar');
    await writeFile(tmpFilePath3, 'baz');

    const filePaths = await walkDir(tmpDirPath);

    expect(filePaths).to.include(tmpFilePath1);
    expect(filePaths).to.include(tmpFilePath2);
    expect(filePaths).to.include(tmpFilePath3);
  });

  it('should support noLinks option', async () => {
    const tmpDirPath = getTmpDirPath();

    const realFile = path.join(tmpDirPath, 'real');
    await writeFile(realFile, 'content');

    const symLink = path.join(tmpDirPath, 'sym');
    try {
      await fsp.symlink(realFile, symLink);
    } catch (error) {
      skipOnDisabledSymlinksInWindows(error, this);
      throw error;
    }

    const filePaths = await walkDir(tmpDirPath, {
      noLinks: true,
    });

    expect(filePaths).to.include(realFile);
    expect(filePaths).not.to.include(symLink);
  });
});
