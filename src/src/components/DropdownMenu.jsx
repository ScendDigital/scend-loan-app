import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { ChevronDown } from "lucide-react"

export default function DropdownMenu() {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger className="inline-flex items-center px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">
        Options <ChevronDown className="ml-2 h-4 w-4" />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Content className="min-w-[150px] bg-white border border-gray-200 rounded shadow-md p-1">
        <DropdownMenuPrimitive.Item className="px-4 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer">
          Profile
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item className="px-4 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer">
          Settings
        </DropdownMenuPrimitive.Item>
        <DropdownMenuPrimitive.Item className="px-4 py-2 text-sm text-red-600 hover:bg-red-100 rounded cursor-pointer">
          Logout
        </DropdownMenuPrimitive.Item>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  )
}
