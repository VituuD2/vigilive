"use client"

import { 
  LayoutDashboard, 
  Target, 
  Video, 
  History, 
  LogOut,
  ShieldCheck,
  Terminal,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { title: 'Monitoring Fleet', icon: Target, href: '/admin/targets' },
  { title: 'Capture Library', icon: Video, href: '/admin/recordings' },
  { title: 'Audit Trail', icon: History, href: '/admin/logs' },
]

export function AdminSidebar({ user, profile }: { user: any, profile: any }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm leading-tight">Vigilive Admin</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Control Plane</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                tooltip={item.title}
                className="hover:text-accent transition-colors"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          <SidebarSeparator className="my-2" />
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={pathname === '/admin/worker-guide'}
              tooltip="Worker Guide"
              className="text-primary hover:text-primary transition-colors"
            >
              <Link href="/admin/worker-guide">
                <Terminal />
                <span>Worker Guide</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
             <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:hidden">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                <span className="text-xs font-bold text-accent">
                  {profile?.full_name?.[0] || user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium truncate">{profile?.full_name || user.email.split('@')[0]}</span>
                <span className="text-[10px] text-muted-foreground truncate capitalize">{profile?.role || 'operator'}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              tooltip="Logout"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
