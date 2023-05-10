/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../../common";
import type {
  BaseBoringBatchable,
  BaseBoringBatchableInterface,
} from "../../../../../@boringcrypto/boring-solidity/contracts/BoringBatchable.sol/BaseBoringBatchable";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "innerError",
        type: "bytes",
      },
    ],
    name: "BatchError",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "calls",
        type: "bytes[]",
      },
      {
        internalType: "bool",
        name: "revertOnFail",
        type: "bool",
      },
    ],
    name: "batch",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const _bytecode =
  "0x6080806040523461001657610322908161001c8239f35b600080fdfe6080604052600436101561001257600080fd5b6000803560e01c63d2423b511461002857600080fd5b60403660031901126100915760043567ffffffffffffffff80821161008d573660238301121561008d57816004013590811161008d573660248260051b8401011161008d57602435908115158203610089576024610086930161012a565b80f35b8380fd5b8280fd5b80fd5b908092918237016000815290565b634e487b7160e01b600052604160045260246000fd5b6040519190601f01601f1916820167ffffffffffffffff8111838210176100de57604052565b6100a2565b67ffffffffffffffff81116100de57601f01601f191660200190565b3d15610125573d90610118610113836100e3565b6100b8565b9182523d6000602084013e565b606090565b91909160005b83811061013d5750505050565b8060051b820135601e19833603018112156101d357820180359067ffffffffffffffff82116101d35760200181360381136101d357600091829161018660405180938193610094565b0390305af46101936100ff565b9015806101cc575b6101c7575060001981146101b157600101610130565b634e487b7160e01b600052601160045260246000fd5b610234565b508361019b565b600080fd5b60005b8381106101eb5750506000910152565b81810151838201526020016101db565b90602091610214815180928185528580860191016101d8565b601f01601f1916010190565b9060206102319281815201906101fb565b90565b60448151106102c7576004810151810190602081602484019303126101d35760248101519067ffffffffffffffff82116101d3570190806043830112156101d357602482015191610287610113846100e3565b91838352604484830101116101d3576102c3926102ab9160446020850191016101d8565b60405162461bcd60e51b815291829160048301610220565b0390fd5b60405163d935448560e01b8152602060048201529081906102c39060248301906101fb56fea2646970667358221220b53725cbb582bf27e228d688446828f2bb00b4557f80019e1f828d2339ca5f1a64736f6c63430008120033";

type BaseBoringBatchableConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: BaseBoringBatchableConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class BaseBoringBatchable__factory extends ContractFactory {
  constructor(...args: BaseBoringBatchableConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<BaseBoringBatchable> {
    return super.deploy(overrides || {}) as Promise<BaseBoringBatchable>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): BaseBoringBatchable {
    return super.attach(address) as BaseBoringBatchable;
  }
  override connect(signer: Signer): BaseBoringBatchable__factory {
    return super.connect(signer) as BaseBoringBatchable__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BaseBoringBatchableInterface {
    return new utils.Interface(_abi) as BaseBoringBatchableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BaseBoringBatchable {
    return new Contract(address, _abi, signerOrProvider) as BaseBoringBatchable;
  }
}
