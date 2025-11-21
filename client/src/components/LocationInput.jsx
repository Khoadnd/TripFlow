import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LocationInput({ 
    value, 
    onChange, 
    onSelect, 
    placeholder = "Search for a place...", 
    className = "",
    required = false
}) {
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef(null);
    const searchCache = useRef({});
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSearch = (e) => {
        const val = e.target.value;
        onChange(val);
        
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (val.length > 2) {
            setIsSearching(true);
            searchTimeout.current = setTimeout(async () => {
                if (searchCache.current[val]) {
                    setSearchResults(searchCache.current[val]);
                    setShowResults(true);
                    setIsSearching(false);
                    return;
                }

                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`);
                    const results = res.data || [];
                    searchCache.current[val] = results;
                    setSearchResults(results);
                    setShowResults(true);
                } catch (error) {
                    console.error("Error searching location:", error);
                } finally {
                    setIsSearching(false);
                }
            }, 800);
        } else {
            setSearchResults([]);
            setShowResults(false);
            setIsSearching(false);
        }
    };

    const handleSelect = (result) => {
        // If onSelect is provided, pass the full result (lat, lon, etc)
        // Otherwise just update the text
        if (onSelect) {
            onSelect(result);
        } else {
            onChange(result.display_name);
        }
        setShowResults(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <MapPin className={cn("absolute left-3 top-3.5 w-4 h-4 text-gray-400", className.includes("text-white") && "text-blue-200")} />
            <input 
                type="text" 
                placeholder={placeholder}
                className={cn(
                    "w-full bg-gray-50 border-0 p-3 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all",
                    className
                )}
                value={value} 
                onChange={handleSearch}
                onFocus={() => value.length > 2 && setShowResults(true)}
                required={required}
            />
            {isSearching && (
                <div className="absolute right-3 top-3.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
            )}
            {showResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto text-gray-900">
                    {searchResults.map((result, index) => (
                        <button 
                            key={index}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                        >
                            <span className="font-bold block truncate">{result.display_name.split(',')[0]}</span>
                            <span className="text-gray-500 text-xs truncate block">{result.display_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
