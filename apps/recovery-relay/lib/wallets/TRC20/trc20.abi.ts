export const abi = [
  {
    outputs: [{ type: 'uint256' }],
    constant: true,
    inputs: [{ name: 'who', type: 'address' }],
    name: 'balanceOf',
    stateMutability: 'View',
    type: 'Function',
  },
  {
    outputs: [{ type: 'bool' }],
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    stateMutability: 'Nonpayable',
    type: 'Function',
  },
];
