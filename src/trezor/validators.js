/* @flow */

import BN from 'bn.js';

import { assertTruth, validatorGenerator, objectToErrorString } from '../utils';
import { validators as messages } from './messages';
import { PATH, MATCH, UNDEFINED, SPLITTER } from './defaults';

/*
 * @TODO Make validators core methods
 *
 * These validators will most likely be used across all wallet types, so it will
 * make sense that as some point they will become core validators.
 */

/**
 * Validate a derivation path passed in as a string
 *
 * @method derivationPathValidator
 *
 * @param {string} derivationPath The derivation path to check
 *
 * @return {boolean} It only returns true if the derivation path is correct,
 * otherwise an Error will be thrown and this will not finish execution.
 */
export const derivationPathValidator = (derivationPath: any): boolean => {
  const { derivationPath: derivationPathMessages } = messages;
  const { COIN_MAINNET, COIN_TESTNET } = PATH;
  let deSerializedDerivationPath: Array<string>;
  let coinType: number;
  try {
    /*
     * Because assignments get bubbled to the top of the method, we need to wrap
     * this inside a try/catch block.
     *
     * Otherwise, this will fail before we have a change to assert it.
     */
    deSerializedDerivationPath = derivationPath.split(PATH.DELIMITER);
    coinType = parseInt(deSerializedDerivationPath[1], 10);
  } catch (caughtError) {
    throw new Error(
      `${derivationPathMessages.notString}: ${derivationPath || UNDEFINED}`,
    );
  }
  /*
   * We need to asser this in a separate step, otherwise, if the size of the split
   * chunks is not correct the `match()` method call will fail before the
   * validator generator sequence will actually start.
   */
  assertTruth({
    /*
     * It should be composed of (at least) four parts
     * (purpouse, coin, account, change + index)
     */
    expression: deSerializedDerivationPath.length === 4,
    message: [
      `${derivationPathMessages.notValidParts}: [`,
      ...deSerializedDerivationPath,
      ']',
    ],
  });
  const validationSequence: Array<Object> = [
    {
      /*
       * It should have the correct Header Key (the letter 'm')
       */
      expression:
        deSerializedDerivationPath[0].split(SPLITTER)[0].toLowerCase() ===
        PATH.HEADER_KEY,
      message: [
        `${derivationPathMessages.notValidHeaderKey}:`,
        deSerializedDerivationPath[0] || UNDEFINED,
      ],
    },
    {
      /*
       * It should have the Ethereum reserved Purpouse (44)
       */
      expression:
        parseInt(deSerializedDerivationPath[0].split(SPLITTER)[1], 10) ===
        PATH.PURPOSE,
      message: [
        `${derivationPathMessages.notValidPurpouse}:`,
        deSerializedDerivationPath[0] || UNDEFINED,
      ],
    },
    {
      /*
       * It should have the correct Coin type
       */
      expression: coinType === COIN_MAINNET || coinType === COIN_TESTNET,
      message: [
        `${derivationPathMessages.notValidCoin}:`,
        deSerializedDerivationPath[1] || UNDEFINED,
      ],
    },
    {
      /*
       * It should have the correct Account format (eg: a number)
       */
      expression: !!deSerializedDerivationPath[2].match(MATCH.DIGITS),
      message: [
        `${derivationPathMessages.notValidAccount}:`,
        deSerializedDerivationPath[2] || UNDEFINED,
      ],
    },
    {
      /*
       * It should have the correct Change and/or Account Index format (eg: a number)
       */
      expression: deSerializedDerivationPath[3]
        .split(SPLITTER)
        .map(value => !!value.match(MATCH.DIGITS))
        .every(truth => truth !== false),
      message: [
        `${derivationPathMessages.notValidChangeIndex}:`,
        deSerializedDerivationPath[3] || UNDEFINED,
      ],
    },
    {
      /*
       * It should have the correct amount of Account Indexed (just one)
       */
      expression: deSerializedDerivationPath[3].split(SPLITTER).length <= 2,
      message: [
        `${derivationPathMessages.notValidAccountIndex}:`,
        deSerializedDerivationPath[3] || UNDEFINED,
      ],
    },
  ];
  return validatorGenerator(
    validationSequence,
    `${derivationPathMessages.genericError}: ${derivationPath || UNDEFINED}`,
  );
};

/**
 * Validate an integer passed in to make sure is safe (< 9007199254740991) and positive
 *
 * @method safeIntegerValidator
 *
 * @param {number} integer The integer to validate
 *
 * @return {boolean} It only returns true if the integer is safe and positive,
 * otherwise an Error will be thrown and this will not finish execution.
 */
export const safeIntegerValidator = (integer: any): boolean => {
  const { safeInteger: safeIntegerMessages } = messages;
  const validationSequence: Array<Object> = [
    {
      /*
       * It should be a number primitive
       */
      expression: typeof integer === 'number',
      message: `${safeIntegerMessages.notNumber}: ${integer}`,
    },
    {
      /*
       * It should be a positive number
       * This is a little less trutfull as integers can also be negative
       */
      expression: integer >= 0,
      message: `${safeIntegerMessages.notPositive}: ${integer}`,
    },
    {
      /*
       * It should be under the safe integer limit: ± 9007199254740991
       * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger
       */
      expression: Number.isSafeInteger(integer),
      message: `${safeIntegerMessages.notSafe}: ${integer}`,
    },
  ];
  return validatorGenerator(
    validationSequence,
    `${safeIntegerMessages.genericError}: ${integer}`,
  );
};

/**
 * Validate a Big Number instance object that was passed in
 *
 * @method bigNumberValidator
 *
 * @param {Object} bigNumber The big number instance to check
 *
 * @return {boolean} It only returns true if the object is an instance of Big Number,
 * otherwise an Error will be thrown and this will not finish execution.
 */
export const bigNumberValidator = (bigNumber: any): boolean => {
  const { bigNumber: bigNumberMessages } = messages;
  const validationSequence: Array<Object> = [
    {
      /*
       * It should be an instance of the BN Class
       */
      expression: BN.isBN(bigNumber),
      message: `${bigNumberMessages.notBigNumber}: ${objectToErrorString(
        bigNumber,
      )}`,
    },
  ];
  return validatorGenerator(
    validationSequence,
    `${bigNumberMessages.genericError}: ${objectToErrorString(bigNumber)}`,
  );
};

/**
 * Validate a BIP32 Ethereum Address
 *
 * @TODO Validate the checksum of the address.
 *
 * @TODO Validate also if the address is in the ICAP format
 *
 * @method addressValidator
 *
 * @param {string} address The big number instance to check
 *
 * @return {boolean} It only returns true if the string is a valid address format,
 * otherwise an Error will be thrown and this will not finish execution.
 */
export const addressValidator = (address: any): boolean => {
  const { address: addressMessages } = messages;
  const validationSequence: Array<Object> = [
    {
      /*
      * It should be a string
      */
      expression: typeof address === 'string',
      message: `${addressMessages.notStringSequence}: ${objectToErrorString(
        address,
      ) || UNDEFINED}`,
    },
    {
      /*
      * It should be the correct length. Either 40 or 42 (with prefix)
      */
      expression: address.length === 40 || address.length === 42,
      message: `${addressMessages.notLength}: ${address || UNDEFINED}`,
    },
    {
      /*
       * It should be in the correct format (hex string of length 40 with or
       * with out the `0x` prefix)
       */
      expression: !!address.match(MATCH.ADDRESS),
      message: `${addressMessages.notFormat}: ${address || UNDEFINED}`,
    },
  ];
  return validatorGenerator(
    validationSequence,
    `${addressMessages.genericError}: ${address || UNDEFINED}`,
  );
};

/**
 * Validate a hex string
 *
 * @method hexSequenceValidator
 *
 * @param {string} hexSequence The big number instance to check
 *
 * @return {boolean} It only returns true if the string is a valid hex format,
 * otherwise an Error will be thrown and this will not finish execution.
 */
export const hexSequenceValidator = (hexSequence: any): boolean => {
  const { hexSequence: hexSequenceMessages } = messages;
  const validationSequence: Array<Object> = [
    {
      /*
      * It should be a string
      */
      expression: typeof hexSequence === 'string',
      message: `${hexSequenceMessages.notStringSequence}: ${objectToErrorString(
        hexSequence,
      ) || UNDEFINED}`,
    },
    {
      /*
      * It should be in the correct format (hex string with or with out the `0x` prefix)
      */
      expression: !!hexSequence.match(MATCH.HEX_STRING),
      message: `${hexSequenceMessages.notFormat}: ${hexSequence || UNDEFINED}`,
    },
    {
      /*
      * It should be under (or equal to) 1024 Bytes in size
      *
      * @TODO Cut down lenght check code repetition
      *
      * This repeats itself here and in the message length check. Might be a good
      * idea to have "generalized" validator types
      */
      expression: hexSequence.length <= 1024,
      message: `${hexSequenceMessages.tooBig}: ${hexSequence || UNDEFINED}`,
    },
  ];
  return validatorGenerator(
    validationSequence,
    `${hexSequenceMessages.genericError}: ${hexSequence || UNDEFINED}`,
  );
};

/**
 * Validate a hex string
 *
 * @method messageValidator
 *
 * @param {string} string The big number instance to check
 *
 * @return {boolean} It only returns true if the string is a valid format,
 * otherwise an Error will be thrown and this will not finish execution.
 */
export const messageValidator = (string: any): boolean => {
  /*
   * Real creative naming there, huh...?
   */
  const { message: messageMessages } = messages;
  const validationSequence: Array<Object> = [
    {
      /*
      * It should be a string
      */
      expression: typeof string === 'string',
      message: `${messageMessages.notString}: ${objectToErrorString(string) ||
        UNDEFINED}`,
    },
    {
      /*
      * It should be under (or equal to) 1024 Bytes in size
      */
      expression: string.length <= 1024,
      message: `${messageMessages.tooBig}: ${string || UNDEFINED}`,
    },
  ];
  return validatorGenerator(
    validationSequence,
    `${messageMessages.genericError}: ${string || UNDEFINED}`,
  );
};
