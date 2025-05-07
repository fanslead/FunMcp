import { memo, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Album, Settings2, Box, User, BotMessageSquare } from 'lucide-react';
import { Dropdown, message } from "antd";
import { Flexbox } from 'react-layout-kit';
import { ActionIcon, Avatar, SideNav, Tooltip } from "@lobehub/ui";

const DesktopLayout = memo(() => {
    const [tab, setTab] = useState<string>('chat');
    const navigate = useNavigate();

    const tabs = [{
        icon: BotMessageSquare,
        key: 'chat',
        description: '聊天',
        path: '/chat',
    }, {
        icon: Box,
        key: 'application',
        description: '应用',
        path: '/app',
    }, {
        icon: Album,
        key: 'mcp',
        description: 'MCP配置',
        path: '/mcp',
    }]

    const items = [
        {
            key: '1',
            label: (
                <span>修改密码</span>
            ),
        },
        {
            key: '2',
            label: (
                <span>系统设置</span>
            ),
        },
        {
            key: '3',
            onClick: () => {
                message.success('退出成功');
                setTimeout(() => {
                    localStorage.removeItem('token');
                    navigate('/login');
                }, 1000);
            },
            label: (
                <span>退出登录</span>
            ),
        },
    ]


    useEffect(() => {
        // 获取当前路由匹配前缀一致的tab
        const currentTab = tabs.find(item => window.location.pathname.startsWith(item.path));
        if (currentTab) {
            setTab(currentTab.key);
        }

        if (window.location.pathname == '/') {
            setTab('application');
        }
       
    }, [])


    function updateTab(item: { key: string, path: string, description: string, icon: any }) {
        setTab(item.key);
        navigate(item.path);
    }

    return (<Flexbox
        height={'100%'}
        horizontal
        width={'100%'}
      >
        <SideNav
          avatar={<Avatar src="/vite.svg" alt="logo" size={40} />}
          bottomActions={
            <Dropdown menu={{ items }} placement="topRight">
              <ActionIcon icon={Settings2} />
            </Dropdown>}
          topActions={
            <>
              {tabs.map((item, index) => {
                  return (
                    <Tooltip key={index} arrow={true} placement='right' title={item.description}>
                      <ActionIcon
                        active={tab === item.key}
                        icon={item.icon}
                        key={item.key}
                        onClick={() => updateTab(item)}
                        size="large"
                      />
                    </Tooltip>)
                })}
            </>
          }
        >
        </SideNav>
        <div style={{ flex: 1, width: '100%' }}>
                <Outlet />
            </div>
      </Flexbox>)

});


export default DesktopLayout;