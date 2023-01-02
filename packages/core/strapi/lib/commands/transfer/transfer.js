'use strict';

const { createTransferEngine } = require('@strapi/data-transfer/lib/engine');
const {
  providers: { createRemoteStrapiDestinationProvider, createLocalStrapiSourceProvider },
} = require('@strapi/data-transfer/lib/strapi');
const { isObject } = require('lodash/fp');
const chalk = require('chalk');

const {
  buildTransferTable,
  createStrapiInstance,
  DEFAULT_IGNORED_CONTENT_TYPES,
} = require('./utils');

/**
 * @typedef TransferCommandOptions Options given to the CLI import command
 *
 * @property {string} [from] The source strapi project
 * @property {string} [to] The destination strapi project
 */

const logger = console;

/**
 * Import command.
 *
 * It transfers data from a local file to a local strapi instance
 *
 * @param {TransferCommandOptions} opts
 */
module.exports = async (opts) => {
  // Validate inputs from Commander
  if (!isObject(opts)) {
    logger.error('Could not parse command arguments');
    process.exit(1);
  }

  const strapi = await createStrapiInstance();

  let source;
  let destination;
  if (opts.from === 'local') {
    source = createSourceProvider(strapi);
  }
  if (opts.to) {
    destination = createDestinationProvider({
      url: opts.to,
      auth: false,
      strategy: 'restore',
      restore: {
        entities: { exclude: DEFAULT_IGNORED_CONTENT_TYPES },
      },
    });
  }
  if (!source || !destination) {
    logger.error("Couldn't create providers");
    process.exit(1);
  }

  const engine = createTransferEngine(source, destination, {
    versionStrategy: 'ignore', // for an export to file, versionStrategy will always be skipped
    schemaStrategy: 'ignore', // for an export to file, schemaStrategy will always be skipped
    transforms: {
      links: [
        {
          filter(link) {
            return (
              !DEFAULT_IGNORED_CONTENT_TYPES.includes(link.left.type) &&
              !DEFAULT_IGNORED_CONTENT_TYPES.includes(link.right.type)
            );
          },
        },
      ],
      entities: [
        {
          filter(entity) {
            return !DEFAULT_IGNORED_CONTENT_TYPES.includes(entity.type);
          },
        },
      ],
    },
  });

  try {
    logger.log(`Starting export...`);

    const results = await engine.transfer();

    const table = buildTransferTable(results.engine);
    logger.log(table.toString());

    logger.log(`${chalk.bold('Transfer process has been completed successfully!')}`);
    process.exit(0);
  } catch (e) {
    logger.error('Transfer process failed unexpectedly:', e);
    process.exit(1);
  }
};

/**
 * It creates a local strapi destination provider
 */
const createSourceProvider = (strapi) => {
  return createLocalStrapiSourceProvider({
    async getStrapi() {
      return strapi;
    },
  });
};

/**
 * It creates a remote strapi destination provider based on the given options
 */
const createDestinationProvider = (opts) => {
  return createRemoteStrapiDestinationProvider(opts);
};
