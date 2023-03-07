import Head from "next/head"
import Header from "@/components/Header"
import HeaderWeb3UIkit from "@/components/HeaderWeb3UIkit"
import LotteryEntrance from "@/components/LotteryEntrance"
import styles from "@/styles/Home.module.css"

export default function Home() {
  return (
    <div>
      <Head>
        <title>Smart Contract Lottery</title>
        <meta name="description" content="A decentralized Smart Contract Lottery" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HeaderWeb3UIkit />
      <LotteryEntrance />
    </div>
  )
}
