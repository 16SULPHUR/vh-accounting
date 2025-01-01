import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { menuConfig } from '@/config/menu'
import { Command } from 'lucide-react'

const MenubarComponent: React.FC = () => {
  const menubarRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault()
        menubarRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleItemClick = (href: string) => {
    navigate(href)
  }

  const renderMenuItems = (items: typeof menuConfig) => {
    return items.map((item, index) => (
      <MenubarMenu key={index}>
        <MenubarTrigger>{item.label}</MenubarTrigger>
        <MenubarContent>
          {item.submenu ? (
            renderSubMenu(item.submenu)
          ) : (
            <MenubarItem onSelect={() => handleItemClick(item.href || '#')}>
              {item.label}
            </MenubarItem>
          )}
        </MenubarContent>
      </MenubarMenu>
    ))
  }

  const renderSubMenu = (submenu: typeof menuConfig) => {
    return submenu.map((subItem, subIndex) => (
      <React.Fragment key={subIndex}>
        {subItem.submenu ? (
          <MenubarSub>
            <MenubarSubTrigger>{subItem.label}</MenubarSubTrigger>
            <MenubarSubContent>{renderSubMenu(subItem.submenu)}</MenubarSubContent>
          </MenubarSub>
        ) : (
          <MenubarItem onSelect={() => handleItemClick(subItem.href || '#')}>
            {subItem.label}
          </MenubarItem>
        )}
        {subIndex < submenu.length - 1 && <MenubarSeparator />}
      </React.Fragment>
    ))
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b-2">
      <Menubar ref={menubarRef} className="p-0 border-none">
        {renderMenuItems(menuConfig)}
      </Menubar>
      <div className="flex items-center text-sm">
        <Command className="h-4 w-4 mr-1" />
        <span>Ctrl+M</span>
      </div>
    </div>
  )
}

export default MenubarComponent

