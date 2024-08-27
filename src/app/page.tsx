"use client"
import dynamic from 'next/dynamic'

const GenZConverter = dynamic(() => import('../components/GenZConverter'), { ssr: false })

export default function Home() {
  return <GenZConverter />
}