import { IconFileExport, IconSettings } from '@tabler/icons-react';
import { useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { BuyKey } from '@/components/Settings/BuyKey';
import { SettingDialog } from '@/components/Settings/SettingDialog';

import { Import } from '../../Settings/Import';
import { Key } from '../../Settings/Key';
import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';
import { PluginKeys } from './PluginKeys';

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);

  const {
    state: {
      apiKey,
      lightMode,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      collapseMenu,
      conversations,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const {
    handleClearConversations,
    handleImportConversations,
    handleExportData,
    handleApiKeyChange,
  } = useContext(ChatbarContext);

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      {conversations.length > 0 && !collapseMenu ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      {!collapseMenu ? (
        <Import onImport={handleImportConversations} />
      ) : null}

      {!collapseMenu ? (
        <SidebarButton
          text={t('Export data')}
          icon={<IconFileExport size={18} />}
          onClick={() => handleExportData()}
        />
      ) : null}

      <BuyKey url="https://hello-ai.anzz.top/home/buy.html" />

      {/* 不管服务端有没有设置，都允许用户配置自己的apikey */}
      {/* {!serverSideApiKeyIsSet ? (
        <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
      ) : null} */}
      <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />

      {!serverSidePluginKeysSet ? <PluginKeys /> : null}

      <SidebarButton
        text={t('Settings')}
        icon={<IconSettings size={18} />}
        onClick={() => setIsSettingDialog(true)}
      />

      <SettingDialog
        open={isSettingDialogOpen}
        onClose={() => {
          setIsSettingDialog(false);
        }}
      />
    </div>
  );
};
