'use strict';

const BbPromise = require('bluebird');
const path = require('path');
const untildify = require('untildify');

const ServerlessError = require('../../serverless-error');
const cliCommandsSchema = require('../../cli/commands-schema');
const recommendedTemplatesList = require('../../templates/recommended-list');
const download = require('../../utils/download-template-from-repo');
const renameService = require('../../utils/rename-service').renameService;
const copyDirContentsSync = require('../../utils/fs/copy-dir-contents-sync');
const dirExistsSync = require('../../utils/fs/dir-exists-sync');
const { progress, log, style } = require('@serverless/utils/log');

const mainProgress = progress.get('main');

class Create {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      create: {
        ...cliCommandsSchema.get('create'),
      },
    };

    this.hooks = {
      'create:create': async () => BbPromise.bind(this).then(this.create),
    };
  }

  async create() {
    if ('template' in this.options) {
      mainProgress.notice('Setting up new project', { isMainEvent: true });

      if (!recommendedTemplatesList.includes(this.options.template)) {
        const errorMessage = [
          `Template "${this.options.template}" is not supported.`,
          ` Supported templates are: ${recommendedTemplatesList
            .map((tmpl) => `"${tmpl}"`)
            .join(', ')}.`,
        ].join('');
        throw new ServerlessError(errorMessage, 'NOT_SUPPORTED_TEMPLATE');
      }

      try {
        await download.downloadTemplateFromExamples({ ...this.options, isLegacy: true });
      } catch (err) {
        // Rethrow if the error is about trying to override an existing folder
        if (
          err.code === 'TARGET_FOLDER_ALREADY_EXISTS' ||
          err.code === 'TEMPLATE_FILE_ALREADY_EXISTS'
        ) {
          throw err;
        }

        if (err.code === 'ENOENT') {
          throw new ServerlessError(
            'Could not find provided template. Ensure that the template provided with "--template" exists.',
            'INVALID_TEMPLATE'
          );
        }

        if (err.code === 'EACCESS') {
          const errorMessage = [
            'Error unable to create a service in this directory. ',
            'Please check that you have the required permissions to write to the directory',
          ].join('');

          throw new ServerlessError(errorMessage, 'UNABLE_TO_CREATE_SERVICE');
        }

        if (err.constructor.name !== 'ServerlessError') throw err;

        throw new ServerlessError(
          `Could not download template. Ensure that you are using the latest version of Serverless Framework: ${err.message}`,
          'TEMPLATE_DOWNLOAD_FAILED'
        );
      }

      log.notice();
      log.notice.success(
        `Project sucessfully created in "${this.options.path || './'}" from "${
          this.options.template
        }" template ${style.aside(
          `(${Math.floor(
            (Date.now() - this.serverless.pluginManager.commandRunStartTime) / 1000
          )}s)`
        )}`
      );

      const isPluginTemplate = this.options.template === 'plugin';

      if (!(this.options.path || this.options.name) && !isPluginTemplate) {
        log.notice();
        log.notice(
          style.aside(
            'Please update the "service" property in serverless.yml with your service name'
          )
        );
      }
    } else if ('template-url' in this.options) {
      // We only show progress in case of setup from `template-url` as setting up from local files is fast
      mainProgress.notice('Setting up new project', { isMainEvent: true });
      return download
        .downloadTemplateFromRepo(
          this.options['template-url'],
          this.options.name,
          this.options.path
        )
        .then((serviceName) => {
          log.notice();
          log.notice.success(
            `Project successfully created in "${
              this.options.path || `./${serviceName}`
            }" ${style.aside(
              `(${Math.floor(
                (Date.now() - this.serverless.pluginManager.commandRunStartTime) / 1000
              )}s)`
            )}`
          );
        })
        .catch((err) => {
          throw new ServerlessError(err, 'BOILERPLATE_GENERATION_ERROR');
        });
    } else if ('template-path' in this.options) {
      // Copying template from a local directory
      const serviceDir = this.options.path
        ? path.resolve(process.cwd(), untildify(this.options.path))
        : path.join(process.cwd(), this.options.name);
      if (dirExistsSync(serviceDir)) {
        const errorMessage = `A folder named "${serviceDir}" already exists.`;
        throw new ServerlessError(errorMessage, 'TARGET_FOLDER_ALREADY_EXISTS');
      }
      copyDirContentsSync(untildify(this.options['template-path']), serviceDir, {
        noLinks: true,
      });
      if (this.options.name) {
        renameService(this.options.name, serviceDir);
      }
      log.notice();
      log.notice.success(
        `Project sucessfully created in "${this.options.path || `./${this.options.name}`}"`
      );
    } else {
      const errorMessage = [
        'You must either pass a template name (--template), ',
        'a URL (--template-url) or a local path (--template-path).',
      ].join('');
      throw new ServerlessError(errorMessage, 'MISSING_TEMPLATE_CLI_PARAM');
    }
    return BbPromise.resolve();
  }
}

module.exports = Create;
