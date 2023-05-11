import { IconCheck, IconKey, IconX } from '@tabler/icons-react';
import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { SidebarButton } from '../Sidebar/SidebarButton';

interface Props {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const Key: FC<Props> = ({ apiKey, onApiKeyChange }) => {
  const { t } = useTranslation('sidebar');
  const [isChanging, setIsChanging] = useState(false);
  const [isPassword, setIsPassword] = useState(false);
  const [newKey, setNewKey] = useState(apiKey);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateKey(newKey);
    }
  };

  const isApiKey = (apiKey: string) => /^sk-[a-zA-Z0-9_]{32,64}$/.test(apiKey);

  const handleUpdateKey = (newKey: string) => {
    onApiKeyChange(newKey.trim());
    setIsChanging(false);
  };

  useEffect(() => {
    if (isChanging) {
      inputRef.current?.focus();
    }
  }, [isChanging]);

  return isChanging ? (
    <div className="duration:200 flex w-full cursor-pointer items-center rounded-md py-3 px-3 transition-colors hover:bg-gray-500/10">
      <IconKey size={18} />

      <input
        ref={inputRef}
        className="ml-2 h-[20px] flex-1 overflow-hidden overflow-ellipsis border-b border-neutral-400 bg-transparent pr-1 text-[12.5px] text-left text-white outline-none focus:border-neutral-100"
        type={isPassword ? 'password' : 'text'}
        autoComplete="off"
        value={newKey}
        onChange={(e) => setNewKey(e.target.value)}
        onKeyDown={handleEnterDown}
        placeholder={t('API Key') || 'API Key'}
      />

      <div className="flex w-[40px]">
        <IconCheck
          className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateKey(newKey);

            if (newKey && !isApiKey(newKey)) {
              setIsChanging(true);
            }

            /* 防止触发浏览器的自动保存 */
            setIsPassword(false);
          }}
        />

        <IconX
          className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
          size={18}
          onClick={(e) => {
            e.stopPropagation();
            // setIsChanging(false);
            // setNewKey(apiKey);

            /* 点击关闭按钮时，清空输入框，清空本地存储的apiKey */
            handleUpdateKey('');
            setNewKey('');
            localStorage.removeItem('apiKey');

            /* 防止触发浏览器的自动保存 */
            setIsPassword(false);

            /* 让输入框保持打开状态 */
            setIsChanging(true);
          }}
        />
      </div>
    </div>
  ) : (
    <SidebarButton
      text={t('OpenAI API Key')}
      icon={<IconKey size={18} />}
      onClick={() => {
        if (isApiKey(localStorage.getItem('apiKey') || '')) {
          setIsPassword(true);
        }

        setIsChanging(true);
      }}
    />
  );
};
