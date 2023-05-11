/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  YearnStrategy,
  YearnStrategyInterface,
} from "../../../contracts/yearn/YearnStrategy";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IYieldBox",
        name: "_yieldBox",
        type: "address",
      },
      {
        internalType: "address",
        name: "_token",
        type: "address",
      },
      {
        internalType: "address",
        name: "_vault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "AmountDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "AmountQueued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "AmountWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "_old",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_new",
        type: "uint256",
      },
    ],
    name: "DepositThreshold",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "cheapWithdrawable",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "compound",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "compoundAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "contractAddress",
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
    name: "currentBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "depositThreshold",
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
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "deposited",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [
      {
        internalType: "string",
        name: "description_",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "emergencyWithdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "result",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
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
    name: "pendingOwner",
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
        name: "amount",
        type: "uint256",
      },
    ],
    name: "setDepositThreshold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenId",
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
    inputs: [],
    name: "tokenType",
    outputs: [
      {
        internalType: "enum TokenType",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
      {
        internalType: "bool",
        name: "direct",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "renounce",
        type: "bool",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "vault",
    outputs: [
      {
        internalType: "contract IYearnVault",
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
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawable",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "wrappedNative",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "yieldBox",
    outputs: [
      {
        internalType: "contract IYieldBox",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x6101008060405234620001aa57606081620013ea8038038091620000248285620001af565b833981010312620001aa578051906001600160a01b03908183168303620001aa57816044826200006660406200005e6020809701620001e9565b9201620001e9565b956080528060a052600080963360018060a01b0319835416178255604051968795869433857f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08180a360016002551660c0819052911660e081905263095ea7b360e01b8452600484015260001960248401525af180156200019f576200015a575b6040516111eb9081620001ff82396080518181816101d201528181610659015261080d015260a05181610171015260c051818181610225015281816105e701528181610e8b015261100d015260e05181818161012a015281816103d1015281816106e701528181610dd1015261109b0152f35b6020813d821162000196575b816200017560209383620001af565b81010312620001925751801515036200018f5780620000e7565b80fd5b5080fd5b3d915062000166565b6040513d84823e3d90fd5b600080fd5b601f909101601f19168101906001600160401b03821190821017620001d357604052565b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b0382168203620001aa5756fe608060408181526004918236101561001657600080fd5b600092833560e01c91826306fdde0314610be757508163078dfbe714610acc57816317d70f7c14610a3b57816322a58c5d14610a7257816330fa738c14610a5657816348dcb05114610a3b5781634cce992d146109db5781634e71e0c81461092857816350188301146106165781637284e41614610898578163734daaa1146108795781638da5cb5b14610851578163afa91cc6146107f0578163ce845d1d14610616578163db2e21bc14610688578163de40657714610644578163e30c39781461061b578163e3575f0514610616578163eb6d3a11146105d2578163f3fef3a3146101a057508063f6b4dfb41461015d5763fbfa77cf1461011757600080fd5b34610159578160031936011261015957517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b5080fd5b5034610159578160031936011261015957517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b9050346105ce57816003193601126105ce576101ba610c79565b6001600160a01b03929091602480359291906101f9337f0000000000000000000000000000000000000000000000000000000000000000881614610faa565b610201611161565b8361020a610dad565b1061058d5782516370a0823160e01b815230838201526020957f000000000000000000000000000000000000000000000000000000000000000088169187818581865afa9081156104c0578a9161055c575b508087116103c3575b506000198601978689116103b1578551908882019263a9059cbb60e01b8452169889858301526044820152604481526080810181811067ffffffffffffffff82111761039f57865251899283929083905af13d15610398573d6102c781610ccc565b906102d486519283610c94565b81523d898883013e5b8161035b575b501561031b575050519081527f058b581e2433b8b02263f5b0e5c2889fcb7b3495112884a3147619038fba46d89190a2600160025580f35b601c9085606494519362461bcd60e51b85528401528201527f426f72696e6745524332303a205472616e73666572206661696c6564000000006044820152fd5b80915051868115918215610374575b50509050386102e3565b83809293500103126103945785015180151581036103945780863861036a565b8780fd5b60606102dd565b634e487b7160e01b8b5260418652848bfd5b634e487b7160e01b8a5260118552838afd5b8551634ca9858360e11b81527f00000000000000000000000000000000000000000000000000000000000000008a169189828881865afa918215610552578c9261051f575b50880388811161050d57875163313ce56760e01b81528c939291908b818a81875afa90811561050357908c9493929186916104ca575b509161045861045d92610452606495610d7f565b90610d56565b610d8d565b89519485938492631cc6d2f960e31b84528b840152308a8401528160448401525af180156104c057908891610493575b50610265565b813d83116104b9575b6104a68183610c94565b810103126104b557863861048d565b8880fd5b503d61049c565b86513d8c823e3d90fd5b8581949692503d83116104fc575b6104e28183610c94565b810103126104f85790518b93919061045861043e565b8480fd5b503d6104d8565b8a513d87823e3d90fd5b634e487b7160e01b8c5260118752858cfd5b9091508981813d831161054b575b6105378183610c94565b8101031261054757519038610408565b8b80fd5b503d61052d565b88513d8e823e3d90fd5b90508781813d8311610586575b6105738183610c94565b8101031261058257513861025c565b8980fd5b503d610569565b601f906020606494519362461bcd60e51b85528401528201527f596561726e53747261746567793a20616d6f756e74206e6f742076616c6964006044820152fd5b8280fd5b505034610159578160031936011261015957517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b610ce8565b50503461015957816003193601126101595760015490516001600160a01b039091168152602090f35b505034610159578160031936011261015957517f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03168152602090f35b83833461015957816003193601126101595781546001600160a01b0393906106b39085163314610d0b565b81519360209485810181811067ffffffffffffffff8211176107dd57845284905282516370a0823160e01b815230818401527f000000000000000000000000000000000000000000000000000000000000000091909116918582602481865afa9182156107d3579086929186926107a2575b506064908686519586948593631cc6d2f960e31b85528401523060248401528160448401525af1928315610797578093610762575b505051908152f35b909192508382813d8311610790575b61077b8183610c94565b8101031261078d57505190838061075a565b80fd5b503d610771565b8251903d90823e3d90fd5b8092508391933d83116107cc575b6107ba8183610c94565b810103126104f8575185916064610725565b503d6107b0565b84513d87823e3d90fd5b634e487b7160e01b865260418452602486fd5b839034610159576020366003190112610159576108499061083b337f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031614610faa565b610843611161565b35610fe5565b600160025580f35b505034610159578160031936011261015957905490516001600160a01b039091168152602090f35b5050346101595781600319360112610159576020906003549051908152f35b838334610159578160031936011261015957805191606083019083821067ffffffffffffffff831117610915575061091193508152602882527f596561726e20737472617465677920666f722077726170706564206e61746976602083015267652061737365747360c01b818301525191829182610c30565b0390f35b634e487b7160e01b815260418552602490fd5b919050346105ce57826003193601126105ce576001546001600160a01b039290918383169190338390036109985750508084549384167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08680a36001600160a01b03199283161783551660015580f35b906020606492519162461bcd60e51b8352820152602060248201527f4f776e61626c653a2063616c6c657220213d2070656e64696e67206f776e65726044820152fd5b9050346105ce5760203660031901126105ce577f3b779194d2cc7daf4de546bec10f6f325d421b2e202c11aa24e86e39845860cc903591610a2660018060a01b038554163314610d0b565b6003548151908152836020820152a160035580f35b50503461015957816003193601126101595751908152602090f35b5050346101595781600319360112610159576020905160018152f35b9050346105ce5760203660031901126105ce5780359167ffffffffffffffff8311610ac85736602384011215610ac857610abc83602493013591610ab583610ccc565b9051610c94565b369201011161078d5780f35b8380fd5b919050346105ce5760603660031901126105ce57610ae8610c79565b916024359182151583036104f857604435928315158403610be35760018060a01b03948591610b1b838954163314610d0b565b15610bc2571692831590811591610bba575b5015610b7f5750508083549283167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08580a36bffffffffffffffffffffffff60a01b8092161782556001541660015580f35b906020606492519162461bcd60e51b835282015260156024820152744f776e61626c653a207a65726f206164647265737360581b6044820152fd5b905038610b2d565b9350505050166bffffffffffffffffffffffff60a01b600154161760015580f35b8580fd5b83853461078d578060031936011261078d578183019083821067ffffffffffffffff83111761091557506109119350815260058252642cb2b0b93760d91b602083015251918291825b6020808252825181830181905290939260005b828110610c6557505060409293506000838284010152601f8019910116010190565b818101860151848201604001528501610c43565b600435906001600160a01b0382168203610c8f57565b600080fd5b90601f8019910116810190811067ffffffffffffffff821117610cb657604052565b634e487b7160e01b600052604160045260246000fd5b67ffffffffffffffff8111610cb657601f01601f191660200190565b34610c8f576000366003190112610c8f576020610d03610dad565b604051908152f35b15610d1257565b606460405162461bcd60e51b815260206004820152602060248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152fd5b81810292918115918404141715610d6957565b634e487b7160e01b600052601160045260246000fd5b604d8111610d6957600a0a90565b8115610d97570490565b634e487b7160e01b600052601260045260246000fd5b604080516370a0823160e01b808252306004830152906001600160a01b03906020907f00000000000000000000000000000000000000000000000000000000000000008316908281602481855afa908115610f3857600091610f7d575b508551634ca9858360e11b81528381600481865afa908115610f7257908491600091610f43575b50610e3e90600493610d56565b9287519283809263313ce56760e01b82525afa908115610f385790839291600091610f06575b5090610e72610e7892610d7f565b90610d8d565b93602486518095819382523060048301527f0000000000000000000000000000000000000000000000000000000000000000165afa938415610efc5750600093610ecb575b50508101809111610d695790565b8181949293943d8311610ef5575b610ee38183610c94565b8101031261078d575051903880610ebd565b503d610ed9565b513d6000823e3d90fd5b919282813d8311610f31575b610f1c8183610c94565b8101031261078d575051829190610e72610e64565b503d610f12565b86513d6000823e3d90fd5b9182813d8311610f6b575b610f588183610c94565b8101031261078d57505183906004610e31565b503d610f4e565b87513d6000823e3d90fd5b908382813d8311610fa3575b610f938183610c94565b8101031261078d57505138610e0a565b503d610f89565b15610fb157565b60405162461bcd60e51b815260206004820152600c60248201526b09cdee840b2d2cad8c884def60a31b6044820152606490fd5b604080516370a0823160e01b815230600482015290916020916001600160a01b0383826024817f000000000000000000000000000000000000000000000000000000000000000085165afa91821561115657600092611127575b5060035482116110745750507f9447d5abbf0af693ca2937bf8b1ec6a8c9dc4fbac672911c633fb31c78e5e3ca9251908152a1565b600091925083906044865180948193636e553f6560e01b83528760048401523060248401527f0000000000000000000000000000000000000000000000000000000000000000165af1801561111c576110f2575b507fde22222b0ac0d69f2a19cd7b1443a29a5f37346640fff3506bdd6a9a9497f9d39251908152a1565b8290813d8311611115575b6111078183610c94565b81010312610c8f57386110c8565b503d6110fd565b84513d6000823e3d90fd5b90918482813d831161114f575b61113e8183610c94565b8101031261078d575051903861103f565b503d611134565b85513d6000823e3d90fd5b60028054146111705760028055565b60405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c006044820152606490fdfea2646970667358221220a20f566e5e7031e8ee23892cd1f44cffca7e2482e09a876d64a6bdcfb528241964736f6c63430008120033";

type YearnStrategyConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: YearnStrategyConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class YearnStrategy__factory extends ContractFactory {
  constructor(...args: YearnStrategyConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _yieldBox: PromiseOrValue<string>,
    _token: PromiseOrValue<string>,
    _vault: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<YearnStrategy> {
    return super.deploy(
      _yieldBox,
      _token,
      _vault,
      overrides || {}
    ) as Promise<YearnStrategy>;
  }
  override getDeployTransaction(
    _yieldBox: PromiseOrValue<string>,
    _token: PromiseOrValue<string>,
    _vault: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _yieldBox,
      _token,
      _vault,
      overrides || {}
    );
  }
  override attach(address: string): YearnStrategy {
    return super.attach(address) as YearnStrategy;
  }
  override connect(signer: Signer): YearnStrategy__factory {
    return super.connect(signer) as YearnStrategy__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): YearnStrategyInterface {
    return new utils.Interface(_abi) as YearnStrategyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): YearnStrategy {
    return new Contract(address, _abi, signerOrProvider) as YearnStrategy;
  }
}
