/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  TricryptoLPGaugeMock,
  TricryptoLPGaugeMockInterface,
} from "../../../contracts/curve/TricryptoLPGaugeMock";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_lpToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_rewardToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "claimable_tokens",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "crv_token",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "lpToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60803461008d57601f61057238819003918201601f19168301916001600160401b0383118484101761009257808492604094855283398101031261008d57610052602061004b836100a8565b92016100a8565b600080546001600160a01b039384166001600160a01b031991821617909155600180549290931691161790556040516104b590816100bd8239f35b600080fd5b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b038216820361008d5756fe608060408181526004918236101561001657600080fd5b600092833560e01c91826333134583146103a85750816338d07436146102b15781635fcbd2851461028957816370a08231146101eb57816376d8b117146101c257816383df67471461009d575063f7c618c11461007257600080fd5b3461009957816003193601126100995760015490516001600160a01b039091168152602090f35b5080fd5b919050346101be5760603660031901126101be576001600160a01b03602435818116036101ba57604435801515036101ba57835416815160208101906323b872dd60e01b8252336024820152306044820152843560648201526064815260a0810181811067ffffffffffffffff8211176101a757845251859283929083905af1610125610427565b81610178575b5015610135578280f35b906020606492519162461bcd60e51b8352820152602060248201527f426f72696e6745524332303a205472616e7366657246726f6d206661696c65646044820152fd5b805180159250821561018d575b50503861012b565b6101a09250602080918301019101610467565b3880610185565b634e487b7160e01b875260418652602487fd5b8380fd5b8280fd5b50503461009957816003193601126100995760015490516001600160a01b039091168152602090f35b83833461009957602092836003193601126101be576102086103d4565b50825482516370a0823160e01b815230928101929092528490829060249082906001600160a01b03165afa92831561027e578093610249575b505051908152f35b909192508382813d8311610277575b61026281836103ef565b81010312610274575051908380610241565b80fd5b503d610258565b8251903d90823e3d90fd5b505034610099578160031936011261009957905490516001600160a01b039091168152602090f35b919050346101be57806003193601126101be57602435801515036101be5760018060a01b038354168151602081019063a9059cbb60e01b825233602482015284356044820152604481526080810181811067ffffffffffffffff8211176101a757845251859283929083905af1610326610427565b81610379575b5015610336578280f35b906020606492519162461bcd60e51b8352820152601c60248201527f426f72696e6745524332303a205472616e73666572206661696c6564000000006044820152fd5b805180159250821561038e575b50503861032c565b6103a19250602080918301019101610467565b3880610386565b849034610099576020366003190112610099576020906103c66103d4565b50678ac7230489e800008152f35b600435906001600160a01b03821682036103ea57565b600080fd5b90601f8019910116810190811067ffffffffffffffff82111761041157604052565b634e487b7160e01b600052604160045260246000fd5b3d15610462573d9067ffffffffffffffff82116104115760405191610456601f8201601f1916602001846103ef565b82523d6000602084013e565b606090565b908160209103126103ea575180151581036103ea579056fea26469706673582212204e7cd6d43f06bd01b4e8011ca11010420ce44f2c91407f37922a73754ef5de2d64736f6c63430008120033";

type TricryptoLPGaugeMockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: TricryptoLPGaugeMockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class TricryptoLPGaugeMock__factory extends ContractFactory {
  constructor(...args: TricryptoLPGaugeMockConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _lpToken: PromiseOrValue<string>,
    _rewardToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<TricryptoLPGaugeMock> {
    return super.deploy(
      _lpToken,
      _rewardToken,
      overrides || {}
    ) as Promise<TricryptoLPGaugeMock>;
  }
  override getDeployTransaction(
    _lpToken: PromiseOrValue<string>,
    _rewardToken: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_lpToken, _rewardToken, overrides || {});
  }
  override attach(address: string): TricryptoLPGaugeMock {
    return super.attach(address) as TricryptoLPGaugeMock;
  }
  override connect(signer: Signer): TricryptoLPGaugeMock__factory {
    return super.connect(signer) as TricryptoLPGaugeMock__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TricryptoLPGaugeMockInterface {
    return new utils.Interface(_abi) as TricryptoLPGaugeMockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): TricryptoLPGaugeMock {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as TricryptoLPGaugeMock;
  }
}
