import { RiMoonLine, RiSunLine } from 'react-icons/ri'

export const Header = () => {
  return (
    <header className="h-16 px-6 flex items-center justify-between bg-[#1a1f2e] border-b border-[#31394d]/50">
      <h1 className="text-xl font-bold text-white">Inventory Management System</h1>
      {/* Add any header actions here */}
    </header>
  )
}