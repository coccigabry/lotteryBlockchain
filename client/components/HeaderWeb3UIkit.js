import { ConnectButton } from "web3uikit"

export default function HeaderWeb3UIkit() {
  return (
    <div className="p-5 border-b-2 flex flex-row">
      <h1 className="py-4 px-4 font-blog text-3xl">Decentralized Lottery</h1>
      <div className="ml-auto py-5 px-4">
        <ConnectButton moralisAuth={false} />
      </div>
    </div>
  )
}
