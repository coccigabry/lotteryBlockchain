import { useEffect } from "react"
import { useMoralis } from "react-moralis"

export default function Header() {
  const { enableWeb3, account, isWeb3Enabled, Moralis, deactivateWeb3, isWeb3EnableLoading } =
    useMoralis()
  const accountNumber = `${account?.slice(0, 5)}...${account?.slice(account.length - 5)}`

  const handleConnect = async () => {
    await enableWeb3()
    window.localStorage.setItem("connected", "injected")
  }

  useEffect(() => {
    if (isWeb3Enabled) return
    if (window.localStorage.getItem("connected")) {
      enableWeb3()
    }
  }, [isWeb3Enabled])

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      console.log(`account changed to ${account}`)
      if (account == null) {
        window.localStorage.removeItem("connected")
        deactivateWeb3()
        console.log("no account found")
      }
    })
  }, [])

  return (
    <div>
      Header
      {account ? (
        <div>Connected to {accountNumber}</div>
      ) : (
        <button onClick={handleConnect} disabled={isWeb3EnableLoading}>
          Connect
        </button>
      )}
    </div>
  )
}
