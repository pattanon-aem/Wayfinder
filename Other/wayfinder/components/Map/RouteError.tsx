function RouteError({ routeError }: { routeError: string }) {
    return (
        <div className='w-full bg-[#120b0b] border border-[#4a2121] rounded-md items-center justify-center p-4'>
            <p className="text-xs text-[#f68181] whitespace-pre-line w-full text-center">{routeError}</p>
        </div>
    )
}

export default RouteError