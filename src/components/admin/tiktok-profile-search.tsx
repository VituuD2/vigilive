
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Check, User } from 'lucide-react';
import { searchTikTokProfiles } from '@/lib/actions/tiktok';
import { TikTokProfile } from '@/lib/services/tiktok';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TikTokProfileSearchProps {
  onSelect: (profile: TikTokProfile) => void;
  defaultValue?: string;
}

export function TikTokProfileSearch({ onSelect, defaultValue = '' }: TikTokProfileSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<TikTokProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2 && !selectedId) {
        setLoading(true);
        const data = await searchTikTokProfiles(query);
        setResults(data);
        setLoading(false);
        setIsOpen(data.length > 0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, selectedId]);

  const handleSelect = (profile: TikTokProfile) => {
    setSelectedId(profile.id);
    setQuery(profile.username);
    setIsOpen(false);
    onSelect(profile);
  };

  return (
    <div className="relative w-full space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search TikTok creators (e.g. khaby.lame)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedId(null);
          }}
          className="pl-10 bg-background/50"
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-border/40 bg-muted/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Official Profiles Found
            </p>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {results.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelect(profile)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/10 transition-colors text-left group"
              >
                <Avatar className="h-10 w-10 border border-border/50">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate text-white">
                      {profile.display_name}
                    </p>
                    <Badge variant="secondary" className="text-[9px] h-4">Verified</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Check className="h-4 w-4 text-accent" />
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 bg-muted/10">
            <p className="text-[9px] text-center text-muted-foreground">
              TikTok API Research Mode Enabled
            </p>
          </div>
        </div>
      )}

      {!isOpen && selectedId && (
        <div className="p-3 rounded-lg border border-accent/20 bg-accent/5 flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={results.find(r => r.id === selectedId)?.avatar_url} />
            <AvatarFallback><User /></AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Account Linked</p>
            <p className="text-[10px] text-muted-foreground truncate">ID: {selectedId}</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20">READY</Badge>
        </div>
      )}
    </div>
  );
}
