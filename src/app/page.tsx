import dynamic from 'next/dynamic'

const GenZConverter = dynamic(() => import('../components/GenZConverter'), { ssr: false })

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <GenZConverter />
    </main>
  )
}