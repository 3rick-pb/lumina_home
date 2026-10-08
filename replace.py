import sys

new_func = """function LayeredFolderCard({ 
  folder, 
  isSelected, 
  onClick 
}: { 
  folder: GoogleDriveFolder; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all duration-300 ease-out cursor-pointer flex flex-col items-center justify-center ${
        isSelected
          ? 'bg-[#222228] border-zinc-400 dark:border-white/30 shadow-lg ring-1 ring-zinc-400/40'
          : 'bg-[#18181c] border-white/5 hover:border-white/15 hover:bg-[#1f1f24] shadow-sm hover:shadow-md'
      }`}
    >
      <div className="relative w-full h-24 sm:h-28 flex items-center justify-center mb-2 pointer-events-none">
        <FolderComponent 
          color={isSelected ? 'blue' : 'black'} 
          size="sm" 
        />
      </div>

      <div className="text-center space-y-0.5 w-full mt-2">
        <h5 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate group-hover:text-white transition-colors duration-200 px-1" title={folder.name}>
          {folder.name}
        </h5>
        <p className="text-[11px] text-zinc-400 font-medium">
          {folder.itemCount || 0} Files
        </p>
      </div>
    </div>
  );
}"""

with open('src/components/profile/GoogleDriveSettingsCard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

del lines[59:127]
lines.insert(59, new_func + '\n')

with open('src/components/profile/GoogleDriveSettingsCard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
