import { IconKey } from '@tabler/icons-react';
import { FC } from 'react';

import { useTranslation } from 'next-i18next';

import { SupportedExportFormats } from '@/types/export';

import { SidebarButton } from '../Sidebar/SidebarButton';

interface Props {
  url?: string;
}

export const BuyKey: FC<Props> = ({ url }) => {
  const { t } = useTranslation('sidebar');
  return (
    <>
      <SidebarButton
        text={t('Buy ApiKey')}
        icon={<IconKey size={18} />}
        onClick={() => {
          const link = document.createElement('a');
          link.href = url || 'https://hello-ai.anzz.top/';
          link.target = '_blank';
          link.click();
        }}
      />
    </>
  );
};
