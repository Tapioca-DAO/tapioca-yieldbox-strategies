/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../common";
import type {
  StkAaveMock,
  StkAaveMockInterface,
} from "../../../contracts/aave/StkAaveMock";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "REWARD_TOKEN",
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
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "allowance",
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
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
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
    name: "cooldown",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
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
        internalType: "uint256",
        name: "_val",
        type: "uint256",
      },
    ],
    name: "freeMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "lastCooldown",
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
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
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
    name: "nonces",
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
        name: "owner_",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "stakerRewardsToClaim",
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
    name: "stakersCooldowns",
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
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [
      {
        internalType: "contract ERC20Mock",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
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
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60c034620001e6574660a052602081017f47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218815246604083015230606083015260608252608082019160018060401b0392818110848211176200016e5760405251902060805262000071600454620001eb565b601f8111620001b5575b507f5465737420546f6b656e00000000000000000000000000000000000000000014600455600554620000ae90620001eb565b601f811162000184575b50600461151560f21b016005556006805460ff1916601217905569152d02c7e14af680000060035560405190610e5a808301918211838310176200016e57602091839162001121833969021e19e0c9bab240000081520301906000f08015620001625760068054610100600160a81b03191660089290921b610100600160a81b0316919091179055604051610ef8908162000229823960805181610de7015260a05181610dc00152f35b6040513d6000823e3d90fd5b634e487b7160e01b600052604160045260246000fd5b600060058152601f60208220920160051c8201915b828110620001a9575050620000b8565b81815560010162000199565b600060048152601f60208220920160051c8201915b828110620001da5750506200007b565b818155600101620001ca565b600080fd5b90600182811c921680156200021d575b60208310146200020757565b634e487b7160e01b600052602260045260246000fd5b91607f1691620001fb56fe608060408181526004918236101561001657600080fd5b600092833560e01c91826306fdde0314610b5757508163091030c314610b2e578163095ea7b314610abd57816318160ddd14610a9e57816323b872dd146108ff578163313ce567146108dd5781633644e515146108c057816370a0823114610889578163787a08a6146108715781637c928fe9146107dc5781637e90d7ef146107ae5781637ecebe001461077657816395d89b411461067357816399248ea7146106465781639a99b4f014610529578163a9059cbb14610450578163b612db4b14610431578163d505accf1461017d57508063dd62ed3e146101305763fc0c546a1461010157600080fd5b3461012c578160031936011261012c57600654905160089190911c6001600160a01b03168152602090f35b5080fd5b503461012c578060031936011261012c5760209161014c610cd0565b82610155610ceb565b6001600160a01b03928316845260018652922091166000908152908352819020549051908152f35b90503461042d5760e036600319011261042d57610198610cd0565b906101a1610ceb565b9260443590606435926084359460ff8616809603610429576001600160a01b039081169586156103e657854210156103b25786895260209560028752848a20988954996000198b1461039f5760018b01905585519184898401927f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c984528b89860152169a8b606085015288608085015260a084015260c083015260c0825260e082019167ffffffffffffffff918184108385111761038a57838852815190209161012082019081118482101761038a57926080926102ca60608f968d9895610100918d5260028652019361190160f01b855261029b610dbb565b8c519485926102b28c850198899251928391610c81565b8301918b8301528d820152038b810184520182610c49565b5190209087519182528482015260a4358782015260c435606082015282805260015afa156103805785908851160361033f5750907f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92592918487526001835280872086600052835281816000205551908152a380f35b83606492519162461bcd60e51b8352820152601860248201527f45524332303a20496e76616c6964205369676e617475726500000000000000006044820152fd5b82513d89823e3d90fd5b604187634e487b7160e01b6000525260246000fd5b634e487b7160e01b8c526011865260248cfd5b835162461bcd60e51b8152602081850152600e60248201526d115490cc8c0e88115e1c1a5c995960921b6044820152606490fd5b835162461bcd60e51b8152602081850152601860248201527f45524332303a204f776e65722063616e6e6f74206265203000000000000000006044820152606490fd5b8780fd5b8280fd5b50503461012c578160031936011261012c576020906007549051908152f35b50503461012c578060031936011261012c5760209161046d610cd0565b82602435928315801590610517575b6104ac575b50519182526001600160a01b0316903390600080516020610ea3833981519152908590a35160018152f35b338152808652818120546104c285821015610d01565b6001600160a01b0384169085338390036104df575b505050610481565b6104f3916104ee841515610d46565b610d8b565b3383528288528383205581522061050b838254610dae565b905582388080856104d7565b50336001600160a01b0384161461047c565b9190503461042d578060031936011261042d57610544610cd0565b61054c610e7a565b6006546001600160a01b03929190869060081c8416803b1561012c5781906024875180948193637c928fe960e01b8352878c8401525af1801561063c5761060d575b5082918660449260209560065460081c16908751988996879563a9059cbb60e01b8752169085015260248401525af190811561060457506105cd575080f35b6020813d82116105fc575b816105e560209383610c49565b8101031261012c5751801515036105f95780f35b80fd5b3d91506105d8565b513d84823e3d90fd5b67ffffffffffffffff819792971161062957845294602061058e565b634e487b7160e01b825260418652602482fd5b85513d89823e3d90fd5b50503461012c578160031936011261012c57600654905160089190911c6001600160a01b03168152602090f35b9190503461042d578260031936011261042d57805191836005549060019082821c92828116801561076c575b6020958686108214610759575084885290811561073757506001146106de575b6106da86866106d0828b0383610c49565b5191829182610ca4565b0390f35b929550600583527f036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db05b82841061072457505050826106da946106d09282010194386106bf565b8054868501880152928601928101610707565b60ff191687860152505050151560051b83010192506106d0826106da386106bf565b634e487b7160e01b845260229052602483fd5b93607f169361069f565b50503461012c57602036600319011261012c5760209181906001600160a01b0361079e610cd0565b1681526002845220549051908152f35b50503461012c57602036600319011261012c576020906107cc610cd0565b506107d5610e7a565b9051908152f35b9190503461042d57602036600319011261042d576003548235926108008483610dae565b91821061083e575060035533835282602052808320610820838254610dae565b90555190815281600080516020610ea383398151915260203393a380f35b606490602084519162461bcd60e51b8352820152600d60248201526c4d696e74206f766572666c6f7760981b6044820152fd5b83346105f957806003193601126105f9574260075580f35b50503461012c57602036600319011261012c5760209181906001600160a01b036108b1610cd0565b16815280845220549051908152f35b50503461012c578160031936011261012c576020906107d5610dbb565b50503461012c578160031936011261012c5760209060ff600654169051908152f35b8284346105f95760603660031901126105f95761091a610cd0565b90610923610ceb565b604435918261095f575b508351918252602094506001600160a01b03908116921690600080516020610ea3833981519152908590a35160018152f35b6001600160a01b0384811680835260208381528784205491989290919061098887831015610d01565b851692838a0361099c575b5050505061092d565b89855260018352888520338652835288852054906000198203610a06575b50509282602099828a946109e58a8e996104ee600080516020610ea38339815191529c9a1515610d46565b92825252838320558152206109fb858254610dae565b905591878080610993565b878210610a5b575092602099858a946109e58a8e9996610a3682600080516020610ea38339815191529d9b610d8b565b86865260018552898620338752855289862055965050509450955099819496506109ba565b895162461bcd60e51b8152908101849052601860248201527f45524332303a20616c6c6f77616e636520746f6f206c6f7700000000000000006044820152606490fd5b50503461012c578160031936011261012c576020906003549051908152f35b50503461012c578060031936011261012c5760209181610adb610cd0565b91602435918291338152600187528181209460018060a01b0316948582528752205582519081527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925843392a35160018152f35b50503461012c57602036600319011261012c57602090610b4c610cd0565b506007549051908152f35b8385346105f957806003193601126105f957809380549160019083821c92828516948515610c3f575b6020958686108114610c2c57858952908115610c085750600114610bb0575b6106da87876106d0828c0383610c49565b81529295507f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b5b828410610bf557505050826106da946106d092820101948680610b9f565b8054868501880152928601928101610bd7565b60ff19168887015250505050151560051b83010192506106d0826106da8680610b9f565b634e487b7160e01b845260228352602484fd5b93607f1693610b80565b90601f8019910116810190811067ffffffffffffffff821117610c6b57604052565b634e487b7160e01b600052604160045260246000fd5b60005b838110610c945750506000910152565b8181015183820152602001610c84565b60409160208252610cc48151809281602086015260208686019101610c81565b601f01601f1916010190565b600435906001600160a01b0382168203610ce657565b600080fd5b602435906001600160a01b0382168203610ce657565b15610d0857565b60405162461bcd60e51b815260206004820152601660248201527545524332303a2062616c616e636520746f6f206c6f7760501b6044820152606490fd5b15610d4d57565b60405162461bcd60e51b815260206004820152601660248201527545524332303a206e6f207a65726f206164647265737360501b6044820152606490fd5b91908203918211610d9857565b634e487b7160e01b600052601160045260246000fd5b91908201809211610d9857565b6000467f000000000000000000000000000000000000000000000000000000000000000003610e0957507f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101917f47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218835246604083015230606083015260608252608082019082821067ffffffffffffffff831117610e66575060405251902090565b634e487b7160e01b81526041600452602490fd5b600754620fd2008101809111610d98574211610e9d5768056bc75e2d6310000090565b60009056feddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa2646970667358221220df512a6c2d412321cbe4e37d2b1cfd6cc9df1e206cba0ca1e465fbfcf566b71264736f6c6343000812003360c03461019a576001600160401b0390601f62000e5a38819003918201601f1916830191848311848410176101845780849260209460405283398101031261019a5751904660a05260405160208101917f47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218835246604083015230606083015260608252608082019082821090821117610184576040525190206080526100a660045461019f565b601f8111610156575b507f5465737420546f6b656e000000000000000000000000000000000000000000146004556005546100e09061019f565b601f8111610128575b50600461151560f21b016005556006805460ff19166012179055600355604051610c809081620001da823960805181610b97015260a05181610b700152f35b600060058152601f60208220920160051c8201915b82811061014b5750506100e9565b81815560010161013d565b600060048152601f60208220920160051c8201915b8281106101795750506100af565b81815560010161016b565b634e487b7160e01b600052604160045260246000fd5b600080fd5b90600182811c921680156101cf575b60208310146101b957565b634e487b7160e01b600052602260045260246000fd5b91607f16916101ae56fe608060408181526004918236101561001657600080fd5b600092833560e01c91826306fdde031461090757508163095ea7b31461089657816318160ddd1461087757816323b872dd146106d5578163313ce567146106b35781633644e5151461068f57816370a08231146106585781637c928fe9146105c35781637ecebe001461058b57816395d89b4114610488578163a9059cbb146103af578163d505accf146100ff575063dd62ed3e146100b457600080fd5b346100fb57806003193601126100fb57806020926100d0610a80565b6100d8610a9b565b6001600160a01b0391821683526001865283832091168252845220549051908152f35b5080fd5b9050346103ab5760e03660031901126103ab5761011a610a80565b90610123610a9b565b9260443590606435926084359460ff86168096036103a7576001600160a01b0390811695861561036457854210156103305786895260209560028752848a20988954996000198b1461031d5760018b01905585519184898401927f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c984528b89860152169a8b606085015288608085015260a084015260c083015260c0825260e082019167ffffffffffffffff918184108385111761030a57838852815190209161012082019081118482101761030a579260809261024c60608f968d9895610100918d5260028652019361190160f01b855261021d610b6b565b8c519485926102348c850198899251928391610a31565b8301918b8301528d820152038b8101845201826109f9565b5190209087519182528482015260a4358782015260c435606082015282805260015afa15610300578590885116036102bf5750907f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259291848752600183528087208688528352818188205551908152a380f35b83606492519162461bcd60e51b8352820152601860248201527f45524332303a20496e76616c6964205369676e617475726500000000000000006044820152fd5b82513d89823e3d90fd5b634e487b7160e01b8d526041875260248dfd5b634e487b7160e01b8c526011865260248cfd5b835162461bcd60e51b8152602081850152600e60248201526d115490cc8c0e88115e1c1a5c995960921b6044820152606490fd5b835162461bcd60e51b8152602081850152601860248201527f45524332303a204f776e65722063616e6e6f74206265203000000000000000006044820152606490fd5b8780fd5b8280fd5b5050346100fb57806003193601126100fb576020916103cc610a80565b82602435928315801590610476575b61040b575b50519182526001600160a01b0316903390600080516020610c2b833981519152908590a35160018152f35b3381528086528181205461042185821015610ab1565b6001600160a01b03841690853383900361043e575b5050506103e0565b6104529161044d841515610af6565b610b3b565b3383528288528383205581522061046a838254610b5e565b90558238808085610436565b50336001600160a01b038416146103db565b919050346103ab57826003193601126103ab57805191836005549060019082821c928281168015610581575b602095868610821461056e575084885290811561054c57506001146104f3575b6104ef86866104e5828b03836109f9565b5191829182610a54565b0390f35b929550600583527f036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db05b82841061053957505050826104ef946104e59282010194386104d4565b805486850188015292860192810161051c565b60ff191687860152505050151560051b83010192506104e5826104ef386104d4565b634e487b7160e01b845260229052602483fd5b93607f16936104b4565b5050346100fb5760203660031901126100fb5760209181906001600160a01b036105b3610a80565b1681526002845220549051908152f35b919050346103ab5760203660031901126103ab576003548235926105e78483610b5e565b918210610625575060035533835282602052808320610607838254610b5e565b90555190815281600080516020610c2b83398151915260203393a380f35b606490602084519162461bcd60e51b8352820152600d60248201526c4d696e74206f766572666c6f7760981b6044820152fd5b5050346100fb5760203660031901126100fb5760209181906001600160a01b03610680610a80565b16815280845220549051908152f35b5050346100fb57816003193601126100fb576020906106ac610b6b565b9051908152f35b5050346100fb57816003193601126100fb5760209060ff600654169051908152f35b828434610874576060366003190112610874576106f0610a80565b906106f9610a9b565b6044359182610735575b508351918252602094506001600160a01b03908116921690600080516020610c2b833981519152908590a35160018152f35b6001600160a01b0384811680835260208381528784205491989290919061075e87831015610ab1565b851692838a03610772575b50505050610703565b898552600183528885203386528352888520549060001982036107dc575b50509282602099828a946107bb8a8e9961044d600080516020610c2b8339815191529c9a1515610af6565b92825252838320558152206107d1858254610b5e565b905591878080610769565b878210610831575092602099858a946107bb8a8e999661080c82600080516020610c2b8339815191529d9b610b3b565b8686526001855289862033875285528986205596505050945095509981949650610790565b895162461bcd60e51b8152908101849052601860248201527f45524332303a20616c6c6f77616e636520746f6f206c6f7700000000000000006044820152606490fd5b80fd5b5050346100fb57816003193601126100fb576020906003549051908152f35b5050346100fb57806003193601126100fb57602091816108b4610a80565b91602435918291338152600187528181209460018060a01b0316948582528752205582519081527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925843392a35160018152f35b838534610874578060031936011261087457809380549160019083821c928285169485156109ef575b60209586861081146109dc578589529081156109b85750600114610960575b6104ef87876104e5828c03836109f9565b81529295507f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b5b8284106109a557505050826104ef946104e59282010194868061094f565b8054868501880152928601928101610987565b60ff19168887015250505050151560051b83010192506104e5826104ef868061094f565b634e487b7160e01b845260228352602484fd5b93607f1693610930565b90601f8019910116810190811067ffffffffffffffff821117610a1b57604052565b634e487b7160e01b600052604160045260246000fd5b60005b838110610a445750506000910152565b8181015183820152602001610a34565b60409160208252610a748151809281602086015260208686019101610a31565b601f01601f1916010190565b600435906001600160a01b0382168203610a9657565b600080fd5b602435906001600160a01b0382168203610a9657565b15610ab857565b60405162461bcd60e51b815260206004820152601660248201527545524332303a2062616c616e636520746f6f206c6f7760501b6044820152606490fd5b15610afd57565b60405162461bcd60e51b815260206004820152601660248201527545524332303a206e6f207a65726f206164647265737360501b6044820152606490fd5b91908203918211610b4857565b634e487b7160e01b600052601160045260246000fd5b91908201809211610b4857565b6000467f000000000000000000000000000000000000000000000000000000000000000003610bb957507f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101917f47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218835246604083015230606083015260608252608082019082821067ffffffffffffffff831117610c16575060405251902090565b634e487b7160e01b81526041600452602490fdfeddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa2646970667358221220466027d8289aaeef324326fca5bc94773eb5da1741eec773a87e81647bb133d464736f6c63430008120033";

type StkAaveMockConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: StkAaveMockConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class StkAaveMock__factory extends ContractFactory {
  constructor(...args: StkAaveMockConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<StkAaveMock> {
    return super.deploy(overrides || {}) as Promise<StkAaveMock>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): StkAaveMock {
    return super.attach(address) as StkAaveMock;
  }
  override connect(signer: Signer): StkAaveMock__factory {
    return super.connect(signer) as StkAaveMock__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): StkAaveMockInterface {
    return new utils.Interface(_abi) as StkAaveMockInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): StkAaveMock {
    return new Contract(address, _abi, signerOrProvider) as StkAaveMock;
  }
}
