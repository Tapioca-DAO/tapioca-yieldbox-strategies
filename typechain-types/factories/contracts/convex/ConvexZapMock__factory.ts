/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  ConvexZapMock,
  ConvexZapMockInterface,
} from "../../../contracts/convex/ConvexZapMock";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_reward1",
        type: "address",
      },
      {
        internalType: "address",
        name: "_reward2",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "reward1",
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
    name: "reward2",
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
];

const _bytecode =
  "0x60803461008d57601f6104f238819003918201601f19168301916001600160401b0383118484101761009257808492604094855283398101031261008d57610052602061004b836100a8565b92016100a8565b600080546001600160a01b039384166001600160a01b0319918216179091556001805492909316911617905560405161043590816100bd8239f35b600080fd5b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b038216820361008d5756fe6040608081526004908136101561001557600080fd5b600091823560e01c9081635a7b87f21461009657508063889069cd1461006f5763facf85b11461004457600080fd5b3461006b578160031936011261006b5760015490516001600160a01b039091168152602090f35b5080fd5b503461006b578160031936011261006b57905490516001600160a01b039091168152602090f35b83833461006b5761012036600319011261006b5767ffffffffffffffff83358181116101ee576100c99036908601610242565b506024358181116101ee576100e19036908601610242565b506044358181116101ee576100f99036908601610242565b506064359081116101f2576101119036908501610242565b5081546001600160a01b039190821690813b156101ee57805194637c928fe960e01b90818752858760248183678ac7230489e800009889878401525af180156101e4576101ce575b8596508460019695965416803b156101ca578592836024928651978895869485528401525af19081156101c157506101ad575b509061019f816101aa93541633906102be565b3390600154166102be565b80f35b6101b6906101f6565b61006b57818361018c565b513d84823e3d90fd5b8580fd5b939490956101db906101f6565b93928590610159565b83513d88823e3d90fd5b8380fd5b8280fd5b67ffffffffffffffff811161020a57604052565b634e487b7160e01b600052604160045260246000fd5b90601f8019910116810190811067ffffffffffffffff82111761020a57604052565b9080601f830112156102b95781359067ffffffffffffffff821161020a578160051b6040519360209361027785840187610220565b855283808601928201019283116102b9578301905b82821061029a575050505090565b81356001600160a01b03811681036102b957815290830190830161028c565b600080fd5b6040516020928382019163a9059cbb60e01b835260018060a01b038092166024820152678ac7230489e80000604482015260448152608081019367ffffffffffffffff948281108682111761020a5760405260009384809481945193165af1913d156103f7573d9081116103e35760405190610343601f8201601f1916860183610220565b81523d828583013e5b826103a0575b50501561035c5750565b6064906040519062461bcd60e51b82526004820152601c60248201527f426f72696e6745524332303a205472616e73666572206661696c6564000000006044820152fd5b80519250821591908483156103bc575b50505090503880610352565b91938180945001031261006b578201519081151582036103e05750803880846103b0565b80fd5b634e487b7160e01b82526041600452602482fd5b50606061034c56fea26469706673582212203df52eab618df5e9d6f935c51ebb9ae2be6e41892695a54fa4cb683c07a82e4164736f6c63430008120033";

type ConvexZapMockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ConvexZapMockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ConvexZapMock__factory extends ContractFactory {
  constructor(...args: ConvexZapMockConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _reward1: PromiseOrValue<string>,
    _reward2: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ConvexZapMock> {
    return super.deploy(
      _reward1,
      _reward2,
      overrides || {}
    ) as Promise<ConvexZapMock>;
  }
  override getDeployTransaction(
    _reward1: PromiseOrValue<string>,
    _reward2: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_reward1, _reward2, overrides || {});
  }
  override attach(address: string): ConvexZapMock {
    return super.attach(address) as ConvexZapMock;
  }
  override connect(signer: Signer): ConvexZapMock__factory {
    return super.connect(signer) as ConvexZapMock__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ConvexZapMockInterface {
    return new utils.Interface(_abi) as ConvexZapMockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ConvexZapMock {
    return new Contract(address, _abi, signerOrProvider) as ConvexZapMock;
  }
}
