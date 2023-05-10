/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  BalancerHelpersMock,
  BalancerHelpersMockInterface,
} from "../../../contracts/balancer/BalancerHelpersMock";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address[]",
            name: "assets",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "minAmountsOut",
            type: "uint256[]",
          },
          {
            internalType: "bytes",
            name: "userData",
            type: "bytes",
          },
          {
            internalType: "bool",
            name: "toInternalBalance",
            type: "bool",
          },
        ],
        internalType: "struct IBalancerVault.ExitPoolRequest",
        name: "",
        type: "tuple",
      },
    ],
    name: "queryExit",
    outputs: [
      {
        internalType: "uint256",
        name: "bptIn",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "amountsOut",
        type: "uint256[]",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address[]",
            name: "assets",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "maxAmountsIn",
            type: "uint256[]",
          },
          {
            internalType: "bytes",
            name: "userData",
            type: "bytes",
          },
          {
            internalType: "bool",
            name: "fromInternalBalance",
            type: "bool",
          },
        ],
        internalType: "struct IBalancerVault.JoinPoolRequest",
        name: "",
        type: "tuple",
      },
    ],
    name: "queryJoin",
    outputs: [
      {
        internalType: "uint256",
        name: "bptOut",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "amountsIn",
        type: "uint256[]",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608080604052346100165761033a908161001c8239f35b600080fdfe6080604052600436101561001257600080fd5b60003560e01c80639ebbf05d146100325763c7b2c52c1461003257600080fd5b3461006b57610040366100e4565b5050505061006761004f610070565b600281526040366020830137604051918291826102bf565b0390f35b600080fd5b604051906060820182811067ffffffffffffffff82111761009057604052565b634e487b7160e01b600052604160045260246000fd5b6040519190601f01601f1916820167ffffffffffffffff81118382101761009057604052565b67ffffffffffffffff81116100905760051b60200190565b6003199160808284011261006b576004803593602492916001600160a01b038435818116810361006b5795604435828116810361006b57956064359267ffffffffffffffff9586851161006b57608090858503011261006b576040519560808701878110828211176102ab576040528486013581811161006b5785018460238201121561006b57868101359061018161017c836100cc565b6100a6565b9384928086528660208097019160051b8401019288841161006b578701905b838210610293575050505087528285013581811161006b5785018460238201121561006b5786810135906101d661017c836100cc565b91858584838152019160051b8301019187831161006b5786869101915b8383106102835750915050880152604485013581811161006b578501958460238801121561006b578087013591821161026f5750610239601f8201601f191683016100a6565b9381855283828801011161006b578060009360649701838601378301015260408401520135801515810361006b57606082015290565b60418491634e487b7160e01b600052526000fd5b82358152918101918691016101f3565b8135838116810361006b5781529086019086016101a0565b83604188634e487b7160e01b600052526000fd5b606090604081019060008152602092816040858094015285518094520193019160005b8281106102f0575050505090565b8351855293810193928101926001016102e256fea26469706673582212209d8a35816bc4705e43c60fab570712dbfc70d1409241a01abae9e754d07d139f64736f6c63430008120033";

type BalancerHelpersMockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: BalancerHelpersMockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class BalancerHelpersMock__factory extends ContractFactory {
  constructor(...args: BalancerHelpersMockConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<BalancerHelpersMock> {
    return super.deploy(overrides || {}) as Promise<BalancerHelpersMock>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): BalancerHelpersMock {
    return super.attach(address) as BalancerHelpersMock;
  }
  override connect(signer: Signer): BalancerHelpersMock__factory {
    return super.connect(signer) as BalancerHelpersMock__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BalancerHelpersMockInterface {
    return new utils.Interface(_abi) as BalancerHelpersMockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BalancerHelpersMock {
    return new Contract(address, _abi, signerOrProvider) as BalancerHelpersMock;
  }
}
