import { ConnectButton } from "web3uikit"

export default function HeaderWeb3UIkit() {
  return (
    <>
      Decentralized Lottery
      <ConnectButton moralisAuth={false} />
    </>
  )
}
