interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
}

export default function TabNavigation({ selectedTab, onTabChange, tabs }: TabNavigationProps) {
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`${
                selectedTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
} 