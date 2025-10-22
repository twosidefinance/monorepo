import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LockPanel from "./LockPanel";
import UnlockPanel from "./UnlockPanel";
import { useState } from "react";
import { useAtomValue } from "jotai";
import { selectedBlockchainAtom } from "@/store/global";
import { useAllTokensList } from "../hooks/query/tokens";
import DashboardSkeleton from "@/features/dashboard/components/skeletons/DashboardSkeleton";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Lock");

  const blockchainStateValue = useAtomValue(selectedBlockchainAtom);
  const {
    isFetching: isAllTokensListLoading,
    data: selectedBlockchainAllTokensList,
  } = useAllTokensList(blockchainStateValue.id);

  if (isAllTokensListLoading) return <DashboardSkeleton />;

  return (
    <div
      className="mx-auto mt-6 mb-12 w-full md:w-120 min-h-119 rounded-2xl p-4 
    bg-custom-root-bg border-2 border-custom-primary-color custom-box-shadow"
    >
      <Tabs defaultValue="Lock" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="w-full bg-transparent flex justify-between border-b-2 border-gray-200 rounded-none">
          <div>
            <TabsTrigger
              key="Lock"
              value="Lock"
              className={`bg-transparent border-0 shadow-none data-[state=active]:bg-transparent cursor-pointer
            data-[state=active]:shadow-none text-base font-semibold text-gray-400 data-[state=active]:text-black relative
            rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-4px] 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black 
            transition-colors hover:text-gray-600`}
            >
              Lock
            </TabsTrigger>
            <TabsTrigger
              key="Unlock"
              value="Unlock"
              className={`bg-transparent border-0 shadow-none data-[state=active]:bg-transparent cursor-pointer
            data-[state=active]:shadow-none text-base font-semibold text-gray-400 data-[state=active]:text-black relative
            rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-4px] 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black 
            transition-colors hover:text-gray-600`}
            >
              Unlock
            </TabsTrigger>
          </div>
        </TabsList>
        <div className="px-4">
          <TabsContent key="Lock" value="Lock">
            <LockPanel
              blockchain={blockchainStateValue}
              fetchedTokens={selectedBlockchainAllTokensList}
            />
          </TabsContent>
          <TabsContent key="Unlock" value="Unlock">
            <UnlockPanel
              blockchain={blockchainStateValue}
              fetchedTokens={selectedBlockchainAllTokensList}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
