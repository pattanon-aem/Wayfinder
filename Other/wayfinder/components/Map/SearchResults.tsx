interface SearchResultsProps {
    results: any[];
    onResultClick: (result: any) => void;
}

export default function SearchResults({ results, onResultClick }: SearchResultsProps) {
    if (!results || results.length === 0) return null;

    return (
        <div
            className="absolute top-10 mt-2 w-full bg-[#0a0a0a] shadow-lg shadow-black/50 border border-[#242424] rounded-lg max-h-[300px] overflow-y-auto z-30 divide-y divide-[#242424]"
            role="listbox"
            aria-label="Search results"
        >
            {results.map((result, idx) => (
                <button
                    key={idx}
                    onClick={() => onResultClick(result)}
                    role="option"
                    className="group w-full text-left p-4 hover:bg-[#111111] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/30"
                >
                    <p className="text-sm text-[#e7e7e7] font-medium truncate">
                        {result.SEARCHVAL}
                    </p>
                    <p className="text-xs text-[#7d7d7d] font-light mt-0.5 truncate">
                        {result.ADDRESS}
                    </p>
                </button>
            ))}
        </div>
    );
}
