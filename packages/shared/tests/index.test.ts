/* eslint-disable @typescript-eslint/no-unused-vars */
import { Readable } from 'stream';
import Zod from 'zod';
import { csvImport } from '../lib/csv';
import { AddressValidator } from '../lib/validateAddress';

type Input = {
  address: string;
  networkProtocol: string | undefined;
  assetId: string;
  label?: string;
};

describe('AddressValidator', () => {
  let addressValidator: AddressValidator;

  const testInputs: Input[] = [
    {
      networkProtocol: 'ETH',
      address: '0x9f3A41DF8191Cf4605623dD637326CBc63D1d92f',
      assetId: 'USDC',
    },
    {
      label: 'BTC SegWit',
      networkProtocol: 'BTC',
      address: 'bc1q9dttlwuva9xrvsz98tk8x7c6u9snf25yxs6t6s',
      assetId: 'BTC',
    },
    {
      label: 'BTC Legacy',
      networkProtocol: 'BTC',
      address: '14x9yfxxbpZiPsvJ7j3rrzNFaZcPXAoJ8D',
      assetId: 'BTC',
    },
    {
      label: 'BSV Addr',
      networkProtocol: 'BTC',
      address: '17VkvGT8qF2ZsqC4bEAxc4DYJL8dxBz6VK',
      assetId: 'BSV',
    },
    {
      label: 'BCH CashAddr',
      networkProtocol: 'BTC',
      address: 'bitcoincash:qz38v5pg3ylhhnz5l7acvetpmfvwgqqu5sut4u63a7',
      assetId: 'BCH',
    },
    {
      label: 'BCH Legacy',
      networkProtocol: 'BTC',
      address: '1Fp2CcjdH1XXoARC1uVbMxz9DfAiyqZpSJ',
      assetId: 'BCH',
    },
    {
      label: 'DOGE',
      networkProtocol: 'BTC',
      address: 'DCc8MMva4spM7VfBozQPoCgvZmvbXDWJL1',
      assetId: 'DOGE',
    },
    {
      label: 'LTC',
      networkProtocol: 'BTC',
      address: 'LgwRUi42gdwXVErQoUfieh5389FP5SHjx6',
      assetId: 'LTC',
    },
    {
      label: 'DASH',
      networkProtocol: 'BTC',
      address: 'XbYavDPHGRJVDyVgLa4j6ZtaMtjG3h8ndh',
      assetId: 'DASH',
    },
    {
      networkProtocol: 'TRX',
      address: 'TQChTm3VxQc2gptvp4Rfm4ayoQ7wyvzj1B',
      assetId: 'TRX',
    },
    {
      networkProtocol: 'SOL',
      address: 'Es8cMivoZYEsCfKBYvZEkgeyYN3saNpzfkoagUBCLy5p',
      assetId: 'SOL',
    },
    {
      networkProtocol: 'COSMOS',
      address: 'cosmos1uy8v5s0x6kq0lwy200es8ecy2xzjzkhwvre950',
      assetId: 'ATOM_COS',
    },
    {
      networkProtocol: 'ADA',
      address: 'addr1qxk0uuhghpk2zxpzth5ryv20fmfem3ym4pxektwjzvfumrchg6feqy3pzpzm63kpvt2ayh5qcwxf8prey4swhgmqld6srxkf3u',
      assetId: 'ADA',
    },
    {
      networkProtocol: 'DOT',
      address: 'E8rsLhGkb2oALVKtFPEGXr47kF9pUKtUu1XRu1JPdwdGpgb',
      assetId: 'KSM',
    },
    {
      networkProtocol: 'HBAR',
      address: '0.0.123',
      assetId: 'HBAR',
    },
    {
      networkProtocol: 'XLM',
      address: 'GAE4W2P7KSNGHXUM4D4QCBSJONM2KRE5DWZ6JLMV5JGJMV4FUBIP6XXM',
      assetId: 'XLM',
    },
    {
      label: 'NEAR Implicit Addr',
      networkProtocol: 'NEAR',
      address: '0a827b91edbfb42032af23e7e22aa5d055fa04d73f3743af08977640de5cfa74',
      assetId: 'NEAR',
    },
    {
      label: 'NEAR Account ID Addr',
      networkProtocol: 'NEAR',
      address: 'mr_token.near',
      assetId: 'NEAR',
    },
    {
      networkProtocol: 'XTZ',
      address: 'tz1VaDzcRFJcFwbUytdf8dMasrs4z67GUTGF',
      assetId: 'XTZ',
    },
    {
      networkProtocol: 'XEM',
      address: 'NDPGUVI3WEXUQNDXE57WKKRRPP7XS3ICVCM5T3BZ',
      assetId: 'XEM',
    },
    {
      label: 'XDC',
      networkProtocol: 'ETH',
      address: 'xdc9f3A41DF8191Cf4605623dD637326CBc63D1d92f',
      assetId: 'XDC',
    },
    {
      networkProtocol: 'TERRA',
      address: 'terra1ltra5sf3lkhvzergghzajlx553ul548kuw2vqu',
      assetId: 'LUNA2',
    },
    {
      networkProtocol: 'XRP',
      address: 'rPG5VsMdG2KttU5NR5YQ5RtjapegMZvkqJ',
      assetId: 'XRP',
    },
    {
      networkProtocol: 'ETC',
      address: '0x9d3e052eC15978aE1FC134a58162Cb2F8447Ad48',
      assetId: 'ETC',
    },
  ];

  beforeEach(() => {
    addressValidator = new AddressValidator();
  });

  testInputs.forEach((input) => {
    const resolvedLabel = input.label || input.networkProtocol;
    it(`should validate ${resolvedLabel} address`, () => {
      const isValid = addressValidator.isValidAddress(input.address, input.networkProtocol, input.assetId);
      expect(isValid).toBe(true);
    });
  });

  it('should handle unsupported networkProtocol', () => {
    expect(() => {
      addressValidator.isValidAddress('12345', 'ABC', 'FAKE');
    }).toThrow('Error validating address with network protocol ABC: Unsupported networkProtocol for address validation ABC');
  });
});

describe('CSV Import', () => {
  const validCSV = `Account Name,Account ID,Asset,Asset Name,Address,Address Type,Address Description,Tag,HD Path
  Default,0,BTC_TEST,Bitcoin Test,abcd,Deposit,1111111111,,m / 44 / 1 / 0 / 0 / 1`;

  const invalidCsvTooManyFields = `Account Name,Account ID,Asset,Asset Name,Address,Address Type,Address Description,Tag,HD Path
  Default,0,BTC_TEST,Bitcoin Test,abcd,Deposit,1111111111,,,m / 44 / 1 / 0 / 0 / 1`;

  const invalidCsvBadValueInField = `Account Name,Account ID,Asset,Asset Name,Address,Address Type,Address Description,Tag,HD Path
  Default,0,BTC_TEST,Bitcoin Test,111111,Deposit,1111111111,,m / 44 / 1 / 0 / 0 / 1`;

  const invalidCsvWithMacros = `Account Name,Account ID,Asset,Asset Name,Address,Address Type,Address Description,Tag,HD Path
  Default,0,BTC_TEST,Bitcoin Test,=6+2,Deposit,1111111111,,m / 44 / 1 / 0 / 0 / 1`;

  const validCsvTerraLuna = `Account Name,Account ID,Asset,Asset Name,Address,Address Type,Address Description,Tag,HD Path
  Default,0,LUNA_TEST,Terra Classic Luna Test,abcd,Deposit,1111111111,,`;

  const invalidCsvMissingDerPath = `Account Name,Account ID,Asset,Asset Name,Address,Address Type,Address Description,Tag,HD Path
Test,1523,BTC,Bitcoin,abcd,Deposit,1111111111,,`;

  it('Should import CSV', async () => {
    await csvImport(Readable.from(validCSV), 'addresses', (row) => {
      expect(row.address === 'abcd').toBe(true);
    }).catch((e) => {
      throw e;
    });
  });

  it('Should fail importing CSV with too many fields error', async () => {
    expect(async () => {
      await csvImport(Readable.from(invalidCsvTooManyFields), 'addresses', (_) => {});
    }).rejects.toStrictEqual({
      type: 'FieldMismatch',
      code: 'TooManyFields',
      message: 'Too many fields: expected 9 fields but parsed 10',
      row: 0,
    });
  });

  it('Should fail importing CSV with bad value in field', async () => {
    expect(async () => {
      await csvImport(Readable.from(invalidCsvBadValueInField), 'addresses', (_) => {});
    }).rejects.toStrictEqual(
      new Zod.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['address'],
          message: 'Expected string, received number',
        },
      ]),
    );
  });

  it('Should fail importing CSV with macros', async () => {
    expect(async () => {
      await csvImport(Readable.from(invalidCsvWithMacros), 'addresses', (_) => {});
    }).rejects.toThrow('Row contains prohibited characters - please reset workspace and check your importing CSV');
  });

  it('Should import Terra Luna Classic Test CSV', async () => {
    await csvImport(Readable.from(validCsvTerraLuna), 'addresses', (row) => {
      const expectedPathParts = [44, 1, 0, 0, 0];
      expect(row.pathParts.every((pathPart, index) => pathPart === expectedPathParts[index])).toBe(true);
    }).catch((e) => {
      throw e;
    });
  });

  it("Should fail importing CSV with missing derivation path that isn't Terra", async () => {
    expect(async () => {
      await csvImport(Readable.from(invalidCsvMissingDerPath), 'addresses', (_) => {});
    }).rejects.toThrow('Row for vault Test (1523) with asset BTC is missing a derivation path.');
  });
});
