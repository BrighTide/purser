/* @flow */

import type { LibraryExportType } from './core/flowtypes';

import { bigNumber, getRandomValues } from './utils';
import debug from './debug';

import { ENV } from './defaults';
import { name, version } from '../package.json';

import software from './software';
import trezor from './trezor';
import ledger from './ledger';

const colonyWallet: LibraryExportType = Object.assign(
  {},
  {
    wallets: {
      software,
      trezor,
      ledger,
    },
    utils: {
      bigNumber,
      getRandomValues,
    },
    about: {
      name,
      version,
      environment: ENV,
    },
  },
  ENV === 'development' ? debug : {},
);

export default colonyWallet;
