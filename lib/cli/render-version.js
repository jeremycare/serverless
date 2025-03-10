'use strict';

const path = require('path');
const os = require('os');
const { version } = require('../../package');
const spawn = require('child-process-ext/spawn');
const { version: dashboardPluginVersion } = require('@serverless/dashboard-plugin/package');
const { platformClientVersion } = require('@serverless/dashboard-plugin');
const isStandaloneExecutable = require('../utils/is-standalone-executable');
const localServerlessPath = require('./local-serverless-path');
const { writeText } = require('@serverless/utils/log');

const serverlessPath = path.resolve(__dirname, '../..');

const resolveTencentCliVersion = async () => {
  try {
    return String(
      (
        await spawn(
          path.resolve(
            os.homedir(),
            `.serverless-tencent/bin/serverless-tencent${
              process.platform === 'win32' ? '.exe' : ''
            }`
          ),
          ['--version', '--plain']
        )
      ).stdoutBuffer
    ).trim();
  } catch (error) {
    return null;
  }
};

module.exports = async () => {
  const installationModePostfix = (() => {
    if (isStandaloneExecutable) return ' (standalone)';
    if (serverlessPath === localServerlessPath) return ' (local)';
    return '';
  })();

  const globalInstallationPostfix = (() => {
    if (EvalError.$serverlessInitInstallationVersion) {
      return ` ${EvalError.$serverlessInitInstallationVersion}v (global)`;
    }
    return '';
  })();

  const tencentCliVersion = await resolveTencentCliVersion();
  writeText(
    `Framework Core: ${version}${installationModePostfix}${globalInstallationPostfix}`,
    `Plugin: ${dashboardPluginVersion}`,
    `SDK: ${platformClientVersion}\n${tencentCliVersion ? `Tencent CLI: ${tencentCliVersion}` : ''}`
  );
};
