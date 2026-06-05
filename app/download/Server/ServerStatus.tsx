import { useEffect, useRef } from 'react'
import Loading from '@/app/Player/Loading'
import { ListServer } from '../../Player/ListServers'

interface Props {
    tryingServer: string | null
    triedServers: string[]
    allFailed: boolean
    onRetry: () => void
}

export function ServerStatus({ tryingServer, triedServers, allFailed, onRetry }: Props) {
    const currentIndex = ListServer.findIndex(s => s.name === tryingServer)
    const containerRef = useRef<HTMLDivElement>(null)

    // auto scroll to keep current server centered
    useEffect(() => {
        if (!containerRef.current || currentIndex < 0) return
        const items = containerRef.current.querySelectorAll('[data-server-item]')
        const current = items[currentIndex] as HTMLElement
        if (current) {
            current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [currentIndex])

    if (allFailed) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 text-white bg-black">
                <p className="text-xl font-semibold">No servers available</p>
                <p className="text-white/50 text-sm">All servers failed to load this title</p>
                <button
                    onClick={onRetry}
                    className="px-6 py-2 border border-white/20 rounded text-sm hover:bg-white/10 transition-colors"
                >
                    Retry
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-6 bg-black">
            <Loading />

            {tryingServer && (
                <div className="flex flex-col items-center gap-2">
                    <p className="text-white/50 text-sm tracking-widest uppercase">Trying</p>
                    <p className="text-white text-lg font-semibold">{tryingServer}</p>
                </div>
            )}

            {/* Fixed height window — only 3 items visible */}
            <div className="relative overflow-hidden" style={{ height: '132px' }}>

                {/* fade top */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-linear-to-b from-black to-transparent z-10 pointer-events-none" />
                {/* fade bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-black to-transparent z-10 pointer-events-none" />

                <div
                    ref={containerRef}
                    className="flex flex-col gap-2 overflow-y-auto scrollbar-none min-w-50 h-full px-1"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {ListServer.map((server, index) => {
                        const tried = triedServers.includes(server.name)
                        const isCurrent = server.name === tryingServer
                        const failed = tried && !isCurrent && tryingServer !== null
                        const distance = Math.abs(index - currentIndex)
                        const isAdjacent = distance === 1
                        const isFar = distance > 1

                        return (
                            <div
                                key={server.name}
                                data-server-item
                                className={`flex items-center justify-between px-4 py-2 rounded border text-sm transition-all duration-300 ${
                                    isCurrent
                                        ? 'border-green-500/50 bg-white/10 text-white scale-100 opacity-100'
                                        : failed
                                        ? 'border-red-500/30 bg-red-500/10 text-red-400 opacity-60'
                                        : isAdjacent
                                        ? 'border-white/10 text-white/40 scale-95 opacity-60'
                                        : isFar
                                        ? 'border-white/5 text-white/20 scale-90 opacity-30'
                                        : 'border-white/10 text-white/30'
                                }`}
                            >
                                <span>{server.name}</span>
                                <span>
                                    {isCurrent ? (
                                        <span className="animate-pulse text-green-500">●</span>
                                    ) : failed ? '✕' : '○'}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}