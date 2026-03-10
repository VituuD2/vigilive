
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, MoreVertical, Play, Pause, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default async function TargetsPage() {
  const supabase = await createClient()
  const { data: targets } = await supabase
    .from('targets')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Monitoring Targets</h1>
          <p className="text-muted-foreground">Manage streams and sources you want to monitor.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add New Target
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search targets..."
            className="pl-9 bg-card/50 border-border/50"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Target Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>External ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Check</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targets && targets.length > 0 ? (
              targets.map((target) => (
                <TableRow key={target.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{target.name}</span>
                      <span className="text-[10px] text-muted-foreground">{target.id.split('-')[0]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase text-[10px]">
                      {target.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{target.external_identifier}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        target.status === 'active' ? 'bg-emerald-500' : 
                        target.status === 'error' ? 'bg-destructive' : 'bg-muted-foreground'
                      }`} />
                      <span className="capitalize text-sm">{target.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {target.last_checked_at ? new Date(target.last_checked_at).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Play className="w-4 h-4 text-emerald-500" /> Start Monitor
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Pause className="w-4 h-4 text-yellow-500" /> Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                  No targets found. Start by adding one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
